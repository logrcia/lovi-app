import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";

// --- env (solo URL + publishable/anon; NUNCA se imprimen claves) ---
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
let ids = { A: null, B: null };
let petB = null, loviB = null, petA = null;

(async () => {
  try {
    const upA = await anonA.auth.signInWithPassword({ email: EMAIL_A, password: PASS });
    const upB = await anonB.auth.signInWithPassword({ email: EMAIL_B, password: PASS });
    check("login A con sesión", !!upA.data.session, upA.error?.message ?? "");
    check("login B con sesión", !!upB.data.session, upB.error?.message ?? "");
    if (!upA.data.session || !upB.data.session) {
      console.log("BLOCKED: no hay sesión para los usuarios de prueba. Revisá el estado de confirmación.");
      return;
    }
    ids.A = upA.data.user.id;
    ids.B = upB.data.user.id;
    await sleep(1500); // deja asentar el trigger handle_new_user

    // Nombres (cada uno actualiza SU fila)
    const uA = await anonA.from("profiles").update({ nombre: "Test A" }).eq("user_id", ids.A);
    check("A setea su nombre", !uA.error, uA.error?.message ?? "");
    const uB = await anonB.from("profiles").update({ nombre: "Test B" }).eq("user_id", ids.B);
    check("B setea su nombre", !uB.error, uB.error?.message ?? "");

    // B crea pet + lovi
    const pet = await anonB.from("pets").insert({ user_id: ids.B, pet_name: "Pachón Test", especie: "perro" }).select("pet_id").single();
    check("B crea pet", !!pet.data, pet.error?.message ?? "");
    petB = pet.data?.pet_id;
    const lovi = await anonB.from("lovis").insert({ creator_user_id: ids.B, pet_id: petB, title: "Test social" }).select("lovi_id").single();
    check("B crea lovi", !!lovi.data, lovi.error?.message ?? "");
    loviB = lovi.data?.lovi_id;

    // ---- RLS / privacidad ----
    // 1) A NO puede leer profiles[B] directo (owner-only)
    const profB = await anonA.from("profiles").select("user_id, email").eq("user_id", ids.B);
    check("A NO ve profiles[B] (RLS)", (profB.data?.length ?? 0) === 0, JSON.stringify(profB.data ?? profB.error?.message));

    // 2-4) RPC públicas: fila visible, allowlist sin email
    const pubB = await anonA.rpc("get_public_profile", { p_user_id: ids.B });
    check("A ve perfil público de B vía RPC", !!pubB.data, pubB.error?.message ?? "");
    check("RPC perfil NO expone email", !Object.keys(pubB.data ?? {}).includes("email"), Object.keys(pubB.data ?? {}).join(","));

    const pubBatch = await anonA.rpc("get_public_profiles", { p_user_ids: [ids.A, ids.B] });
    check("get_public_profiles devuelve 2", (pubBatch.data?.length ?? 0) === 2, JSON.stringify(pubBatch.data ?? pubBatch.error?.message));
    check("batch NO expone email", (pubBatch.data ?? []).every((r) => !("email" in r)));

    const search = await anonA.rpc("search_public_users", { p_query: "Test B" });
    check("search encuentra a B", (search.data ?? []).some((r) => r.user_id === ids.B), JSON.stringify(search.data ?? search.error?.message));

    // 5) Feed pre-follow: A NO ve lovi de B
    const feedPre = await anonA.from("lovis").select("lovi_id");
    check("A NO ve lovi de B antes de seguir", !(feedPre.data ?? []).some((l) => l.lovi_id === loviB), JSON.stringify(feedPre.data ?? feedPre.error?.message));

    // 6-8) Follow + visibilidad post-follow
    const fol = await anonA.from("follows").insert({ follower_user_id: ids.A, following_user_id: ids.B });
    check("A sigue a B", !fol.error, fol.error?.message ?? "");

    const counts = await anonA.rpc("get_follow_counts", { p_user_id: ids.B });
    check("B tiene 1 seguidor", (counts.data ?? [])[0]?.followers_count === 1, JSON.stringify(counts.data ?? counts.error?.message));

    const feedPost = await anonA.from("lovis").select("lovi_id, creator_user_id");
    check("A ve lovi de B tras seguir", (feedPost.data ?? []).some((l) => l.lovi_id === loviB));
    const petsB = await anonA.from("pets").select("pet_id").eq("user_id", ids.B);
    check("A ve pet de B tras seguir", (petsB.data ?? []).some((p) => p.pet_id === petB));

    // 9) B NO edita ni borra contenido de A
    const petARes = await anonA.from("pets").insert({ user_id: ids.A, pet_name: "Michi Test", especie: "gato" }).select("pet_id").single();
    check("A crea pet A", !!petARes.data, petARes.error?.message ?? "");
    petA = petARes.data?.pet_id;
    const editPet = await anonB.from("pets").update({ pet_name: "Hackeado" }).eq("pet_id", petA);
    check("B NO edita pet de A", (editPet.data ?? []).length === 0 && !editPet.error, JSON.stringify(editPet.data ?? editPet.error?.message));
    const delPet = await anonB.from("pets").delete().eq("pet_id", petA);
    check("B NO borra pet de A", (delPet.data ?? []).length === 0, JSON.stringify(delPet.data ?? delPet.error?.message));

    // 10) A NO inserta follow como otra persona (RLS insert)
    const fake = "00000000-0000-4000-8000-000000000001";
    const fakeFol = await anonA.from("follows").insert({ follower_user_id: fake, following_user_id: ids.B });
    check("A NO inserta follow de otra persona", !!fakeFol.error, JSON.stringify(fakeFol.data ?? fakeFol.error?.message));

    // 11) A NO se sigue a sí mismo (CHECK)
    const selfFol = await anonA.from("follows").insert({ follower_user_id: ids.A, following_user_id: ids.A });
    check("A NO se sigue a sí mismo", !!selfFol.error, JSON.stringify(selfFol.data ?? selfFol.error?.message));

    // 12) get_follow_list
    const fl = await anonA.rpc("get_follow_list", { p_user_id: ids.B, p_direction: "followers" });
    check("get_follow_list followers de B = A", (fl.data ?? []).some((r) => r.user_id === ids.A), JSON.stringify(fl.data ?? fl.error?.message));
    check("get_follow_list NO expone email", (fl.data ?? []).every((r) => !("email" in r)));

    // 13) Barrido: ningún payload social contiene email
    const allPayloads = [pubB, pubBatch, search, counts, fl, feedPost, petsB].map((x) => JSON.stringify(x.data ?? ""));
    check("ningún payload social contiene email", allPayloads.every((p) => !/lovi\.dev|"email"/.test(p)));

    // ---- Cleanup de datos de prueba (los auth.users quedan para UI test) ----
    await anonA.from("follows").delete().eq("follower_user_id", ids.A).eq("following_user_id", ids.B);
    await anonA.from("pets").delete().eq("pet_id", petA);
    if (loviB) await anonB.from("lovis").delete().eq("lovi_id", loviB);
    if (petB) await anonB.from("pets").delete().eq("pet_id", petB);
    console.log(`CLEANUP: follows/pets/lovis de prueba borrados. Usuarios de prueba quedan en auth (${EMAIL_A}, ${EMAIL_B}) — borralos desde el dashboard cuando termines.`);
  } catch (e) {
    console.error("SCRIPT ERROR:", e.message);
  } finally {
    const fails = results.filter((r) => !r.ok);
    console.log(`\n=== RESUMEN: ${results.length} checks, ${fails.length} FAIL ===`);
    if (fails.length) fails.forEach((f) => console.log("FAIL ", f.name, "|", f.extra));
  }
})();