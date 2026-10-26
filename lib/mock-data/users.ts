/**
 * Usuarios del prototipo.
 *
 * NO hay `email` en ningun tipo: el prototipo respeta desde el dato la regla
 * de que jamas se expone email (ver las funciones SECURITY DEFINER de la
 * migracion 0004, que usan allowlist user_id/nombre/image/created_at).
 *
 * `pets` NO es fuente de verdad: se deriva de pets.ts en index.ts. Acá solo
 * viven los datos que son propriamente de la persona.
 */

import { userAvatar } from "./assets";
import type { MockUser } from "./types";

type MockUserSeed = Omit<MockUser, "pets">;

export const MOCK_USERS: MockUserSeed[] = [
  {
    id: "user-abril",
    nombre: "Abril",
    avatar: userAvatar("Abril"),
    bio: "Tres mascotas, un jardín chico y demasiados recuerdos. Lovi es mi diario.",
  },
  {
    id: "user-lola",
    nombre: "Lola",
    avatar: userAvatar("Lola"),
    bio: "Mora corre, Coco juzga. Ese es el sistema.",
  },
  {
    id: "user-sol",
    nombre: "Sol",
    avatar: userAvatar("Sol"),
    bio: "Conejas, puppies y un loro que aprendió a decir chau.",
  },
  {
    id: "user-catalina",
    nombre: "Catalina",
    avatar: userAvatar("Catalina"),
    bio: "Bruno ya es mayor, pero todavía cree que es cachorro.",
  },
  {
    id: "user-martina",
    nombre: "Martina",
    avatar: userAvatar("Martina"),
    bio: "Amo los animales que no hacen ruido. Y también los que sí.",
  },
];
