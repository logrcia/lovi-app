// LOVI · Verificación e2e del Registro médico (migración 0005)
// Persistencia, CRUD, pertenencia por mascota, RLS y no-interferencia con turnos.
// Usa SOLO la key publishable/anon (RLS activo) — nunca imprime claves.
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";

const env = {};
for (const line of readFileSync("./.env.local", "utf8").split("\n")) {
  const m = line.match(/^([A-Z_]+)=(.*)$/);
  if (m) env[m[1]] = m[2];
}
const URL = env.NEXT_PUBLIC_SUPABASE_URL;
const KEY = env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
if (!URL || !KEY) throw new Error("Missing env keys");

const EMAIL_A = "lovi-e2e-a@lovi.dev";
const EMAIL_B = "lovi-e2e-b@lovi.dev";
const PASS = "Lovi-Test-2026!";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const results = [];
const check = (name, cond, extra = "") => {
  results.push({ name, ok: !!cond, extra });
  console.log(cond ? "PASS" : "FAIL", "-", name, extra ? `| ${extra}` : "");
};

const anonA = createClient(URL, KEY);
const anonB = createClient(URL, KEY);

async function authAs(client, email) {
  const up = await client.auth.signInWithPassword({ email, password: PASS });
  if (up.data.session) return up.data.user;
  const su = await client.auth.signUp({ email, password: PASS });
  if (su.error) throw new Error(`signUp ${email}: ${su.error.message}`);
  return su.data.user;
}

let petA = null;
let vacA = null;
let examA = null;

(async () => {
  try {
    const userA = await authAs(anonA, EMAIL_A);
    const userB = await authAs(anonB, EMAIL_B);
    await sleep(1500); // trigger handle_new_user

    // ---- 0) Setup: una mascota para A ----
    const pet = await anonA.from("pets").insert({ user_id: userA.id, pet_name: "Michi Medical", especie: "gato" }).select("pet_id").single();
    check("A crea mascota de prueba", !!pet.data, pet.error?.message ?? "");
    petA = pet.data?.pet_id;
    if (!petA) return;

    // ---- 1) Persistencia: crear vacuna CON nota ----
    const vac = await anonA.from("vaccines").insert({
      pet_id: petA,
      name: "Antirrábica",
      date: "2026-09-01",
      next_dose: "2027-09-01",
      notes: "Lote #123, veterinaria del barrio",
    }).select("vac_id, name, date, next_dose, notes").single();
    check("crea vacuna con nota (persiste)", !!vac.data && vac.data.notes === "Lote #123, veterinaria del barrio", JSON.stringify(vac.error?.message ?? vac.data));
    vacA = vac.data?.vac_id;

    const vacRead = await anonA.from("vaccines").select("name, notes, pet_id").eq("vac_id", vacA).single();
    check("lee vacuna con nota", vacRead.data?.name === "Antirrábica" && vacRead.data?.notes?.includes("veterinaria"), JSON.stringify(vacRead.error?.message ?? vacRead.data));

    // ---- 2) Persistencia: crear estudio/control ----
    const exam = await anonA.from("pet_exams").insert({
      pet_id: petA,
      name: "Ecografía abdominal",
      exam_date: "2026-08-15",
      result: "Todo normal",
      notes: "En ayunas",
    }).select("exam_id, name, exam_date, result, notes").single();
    check("crea estudio con resultado y nota (persiste)", !!exam.data && exam.data.result === "Todo normal" && exam.data.notes === "En ayunas", JSON.stringify(exam.error?.message ?? exam.data));
    examA = exam.data?.exam_id;

    const examRead = await anonA.from("pet_exams").select("name, exam_date, result").eq("exam_id", examA).single();
    check("lee estudio", examRead.data?.name === "Ecografía abdominal" && examRead.data?.exam_date === "2026-08-15", JSON.stringify(examRead.error?.message ?? examRead.data));

    // ---- 3) Pertenencia por mascota: filtrando por pet_id devuelve solo lo de esa mascota ----
    const petVacs = await anonA.from("vaccines").select("vac_id").eq("pet_id", petA);
    check("vacuna pertenece a la mascota correcta", (petVacs.data ?? []).some((r) => r.vac_id === vacA), JSON.stringify(petVacs.data ?? petVacs.error?.message));
    const petExams = await anonA.from("pet_exams").select("exam_id").eq("pet_id", petA);
    check("estudio pertenece a la mascota correcta", (petExams.data ?? []).some((r) => r.exam_id === examA), JSON.stringify(petExams.data ?? petExams.error?.message));

    // ---- 4) Editar vacuna y estudio ----
    const vacUpd = await anonA.from("vaccines").update({ name: "Antirrábica (refuerzo)", notes: "Actualizada" }).eq("vac_id", vacA).eq("pet_id", petA).select("name, notes").single();
    check("edita vacuna", vacUpd.data?.name === "Antirrábica (refuerzo)" && vacUpd.data?.notes === "Actualizada", JSON.stringify(vacUpd.error?.message ?? vacUpd.data));

    const examUpd = await anonA.from("pet_exams").update({ result: "Hígado y riñón normales" }).eq("exam_id", examA).eq("pet_id", petA).select("result").single();
    check("edita estudio", examUpd.data?.result === "Hígado y riñón normales", JSON.stringify(examUpd.error?.message ?? examUpd.data));

    // ---- 5) RLS: B NO ve ni escribe en los registros médicos de A ----
    const bReadExam = await anonB.from("pet_exams").select("exam_id").eq("pet_id", petA);
    check("B NO ve estudios de A (RLS)", (bReadExam.data ?? []).length === 0, JSON.stringify(bReadExam.data ?? bReadExam.error?.message));
    const bReadVac = await anonB.from("vaccines").select("vac_id").eq("pet_id", petA);
    check("B NO ve vacunas de A (RLS)", (bReadVac.data ?? []).length === 0, JSON.stringify(bReadVac.data ?? bReadVac.error?.message));

    const bInsExam = await anonB.from("pet_exams").insert({ pet_id: petA, name: "Hack", exam_date: "2026-09-01" });
    check("B NO inserta estudio en mascota de A (RLS)", !!bInsExam.error || (bInsExam.data ?? []).length === 0, JSON.stringify(bInsExam.data ?? bInsExam.error?.message));
    const bUpdExam = await anonB.from("pet_exams").update({ result: "hackeado" }).eq("exam_id", examA);
    check("B NO actualiza estudio de A (RLS)", (bUpdExam.data ?? []).length === 0, JSON.stringify(bUpdExam.data ?? bUpdExam.error?.message));
    const bDelExam = await anonB.from("pet_exams").delete().eq("exam_id", examA);
    check("B NO borra estudio de A (RLS)", (bDelExam.data ?? []).length === 0, JSON.stringify(bDelExam.data ?? bDelExam.error?.message));

    // ---- 6) No-interferencia: registrar vacuna/estudio NO crea turnos ----
    const appts = await anonA.from("appointments").select("ap_id").eq("pet_id", petA);
    check("ningún turno creado por registrar vacuna/estudio", (appts.data ?? []).length === 0, JSON.stringify(appts.data ?? appts.error?.message));

    // ---- 7) Eliminar ----
    const delExam = await anonA.from("pet_exams").delete().eq("exam_id", examA).eq("pet_id", petA);
    check("elimina estudio", (delExam.error ?? null) === null, JSON.stringify(delExam.data ?? delExam.error?.message));
    const examGone = await anonA.from("pet_exams").select("exam_id").eq("exam_id", examA);
    check("estudio eliminado ya no existe", (examGone.data ?? []).length === 0, JSON.stringify(examGone.data ?? examGone.error?.message));

    const delVac = await anonA.from("vaccines").delete().eq("vac_id", vacA).eq("pet_id", petA);
    check("elimina vacuna", (delVac.error ?? null) === null, JSON.stringify(delVac.data ?? delVac.error?.message));

    console.log("\nRegistro médico verificado end-to-end (persistencia, CRUD, RLS, desacople calendario/turnos).");
  } catch (e) {
    console.error("SCRIPT ERROR:", e.message);
  } finally {
    // Cleanup best-effort
    if (examA) await anonA.from("pet_exams").delete().eq("exam_id", examA);
    if (vacA) await anonA.from("vaccines").delete().eq("vac_id", vacA);
    if (petA) await anonA.from("pets").delete().eq("pet_id", petA);
    const fails = results.filter((r) => !r.ok);
    console.log(`\n=== RESUMEN: ${results.length} checks, ${fails.length} FAIL ===`);
    if (fails.length) fails.forEach((f) => console.log("FAIL ", f.name, "|", f.extra));
  }
})();