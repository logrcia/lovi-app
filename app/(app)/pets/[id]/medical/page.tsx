import Link from "next/link";
import { notFound } from "next/navigation";

import { PetExamForm } from "@/components/pet-exam-form";
import { PetExamItem } from "@/components/pet-exam-item";
import { VaccineForm } from "@/components/vaccine-form";
import { VaccineItem } from "@/components/vaccine-item";
import { getPet, getPetExams, getVaccines } from "@/lib/queries";
import { createClient } from "@/lib/supabase/server";

export const instant = false;

export const metadata = { title: "Registro médico · Lovi" };

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ tab?: string }>;
};

export default async function PetMedicalPage({ params, searchParams }: Props) {
  const { id } = await params;
  const sp = await searchParams;
  const tab = sp.tab === "exams" ? "exams" : "vaccines";

  const supabase = await createClient();
  const [pet, vaccines, exams] = await Promise.all([
    getPet(supabase, id),
    getVaccines(supabase, id),
    getPetExams(supabase, id),
  ]);
  if (!pet) notFound();

  // Agrupar por año (mismo patrón que la lista vieja de vacunas)
  const vaccineGroups = new Map<string, typeof vaccines>();
  for (const v of vaccines) {
    const yearKey = v.date.slice(0, 4);
    const list = vaccineGroups.get(yearKey) ?? [];
    list.push(v);
    vaccineGroups.set(yearKey, list);
  }
  const vaccineYears = [...vaccineGroups.keys()].sort((a, b) => b.localeCompare(a));

  const examGroups = new Map<string, typeof exams>();
  for (const e of exams) {
    const yearKey = e.exam_date.slice(0, 4);
    const list = examGroups.get(yearKey) ?? [];
    list.push(e);
    examGroups.set(yearKey, list);
  }
  const examYears = [...examGroups.keys()].sort((a, b) => b.localeCompare(a));

  return (
    <div className="mx-auto max-w-3xl">
      <header className="mb-8">
        <p className="sticker bg-navy text-cream">registro médico</p>
        <h1 className="lovi-headline mt-3">
          Salud de <span className="italic text-fucsia">{pet.pet_name}</span>
        </h1>
        <Link href={`/pets/${pet.pet_id}`} className="mt-2 inline-block text-sm font-semibold text-ink/70 underline-offset-4 hover:underline">
          ← Volver a su perfil
        </Link>
      </header>

      <nav className="mb-8 flex gap-2">
        <Link
          href={`/pets/${pet.pet_id}/medical`}
          className={tab === "vaccines" ? "btn-ink" : "btn-ghost-ink"}
        >
          Vacunas
        </Link>
        <Link
          href={`/pets/${pet.pet_id}/medical?tab=exams`}
          className={tab === "exams" ? "btn-ink" : "btn-ghost-ink"}
        >
          Estudios y controles
        </Link>
      </nav>

      {tab === "vaccines" ? (
        <>
          <div className="mb-10">
            <VaccineForm petId={pet.pet_id} />
          </div>

          {vaccines.length === 0 ? (
            <p className="card-lovi px-5 py-6 text-sm text-muted-foreground">
              Todavía no cargaste ninguna vacuna para {pet.pet_name}.
            </p>
          ) : (
            <div className="flex flex-col gap-8">
              {vaccineYears.map((year) => (
                <section key={year}>
                  <h2 className="mb-3 font-display text-xl font-semibold text-ink">{year}</h2>
                  <ul className="flex flex-col gap-3">
                    {(vaccineGroups.get(year) ?? []).map((v, i) => (
                      <li key={v.vac_id} className={`card-lovi ${i % 2 === 0 ? "md:rotate-[0.2deg]" : "md:rotate-[-0.2deg]"}`}>
                        <VaccineItem petId={pet.pet_id} vaccine={v} />
                      </li>
                    ))}
                  </ul>
                </section>
              ))}
            </div>
          )}
        </>
      ) : (
        <>
          <div className="mb-10">
            <PetExamForm petId={pet.pet_id} />
          </div>

          {exams.length === 0 ? (
            <p className="card-lovi px-5 py-6 text-sm text-muted-foreground">
              Todavía no cargaste ningún estudio o control para {pet.pet_name}.
            </p>
          ) : (
            <div className="flex flex-col gap-8">
              {examYears.map((year) => (
                <section key={year}>
                  <h2 className="mb-3 font-display text-xl font-semibold text-ink">{year}</h2>
                  <ul className="flex flex-col gap-3">
                    {(examGroups.get(year) ?? []).map((e, i) => (
                      <li key={e.exam_id} className={`card-lovi ${i % 2 === 0 ? "md:rotate-[0.2deg]" : "md:rotate-[-0.2deg]"}`}>
                        <PetExamItem petId={pet.pet_id} exam={e} />
                      </li>
                    ))}
                  </ul>
                </section>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}