import { PetForm } from "@/components/pet-form";

export const instant = false;

export default function NewPetPage() {
  return (
    <div className="mx-auto max-w-lg">
      <header className="mb-8">
        <p className="sticker bg-orange text-ink">nueva compañía</p>
        <h1 className="lovi-headline mt-3">Agregar una mascota</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Arrancá su diario: después vas a poder loviar recuerdos, fotos y
          turnos.
        </p>
      </header>
      <PetForm />
    </div>
  );
}