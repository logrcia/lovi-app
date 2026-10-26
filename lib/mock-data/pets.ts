/**
 * Mascotas del prototipo.
 *
 * `followerCount` es la base SIN contar al viewer mock actual. El contador
 * que ve el usuario es `followerCount + (isFollowing ? 1 : 0)` y se calcula
 * en index.ts, nunca aca. Este archivo es inmutable.
 *
 * Cuando se conecte Supabase: una fila de `pets` + `count(*) sobre pet_follows`
 * da exactamente estos dos campos.
 */

import { petImage } from "./assets";
import type { MockPet } from "./types";

export const MOCK_PETS: MockPet[] = [
  // --- Abril (viewer mock actual) ---
  {
    id: "pet-vitto",
    ownerId: "user-abril",
    name: "Vitto",
    image: petImage("vitto", 720, 540),
    especie: "perro",
    birthDate: "2021-03-14",
    ageLabel: "3 años",
    description:
      "Golden retriever, guardián de la casa. Le encanta el sol del living y dormirse con los pies de alguien encima.",
    followerCount: 242,
  },
  {
    id: "pet-luna",
    ownerId: "user-abril",
    name: "Luna",
    image: petImage("luna", 720, 540),
    especie: "gata",
    birthDate: "2023-01-08",
    ageLabel: "3 años",
    description:
      "Negra, chiquita y bicolor. Duerme 18 horas y tiene la costumbre de esconderse en la caja de cartón más importante de la casa.",
    followerCount: 80,
  },
  {
    id: "pet-milo",
    ownerId: "user-abril",
    name: "Milo",
    image: petImage("milo", 720, 540),
    especie: "gato",
    birthDate: "2019-11-22",
    ageLabel: "6 años",
    description:
      "Atajante. El más grande de los tres y el que menos deja que lo acaricien. Su lugar oficial es el sillón de la ventana.",
    followerCount: 125,
  },

  // --- Lola ---
  {
    id: "pet-mora",
    ownerId: "user-lola",
    name: "Mora",
    image: petImage("mora", 720, 540),
    especie: "perro",
    birthDate: "2020-06-02",
    ageLabel: "6 años",
    description:
      "Border collie medio desastrada. Corre en círculos antes de dormir. Aprendió a abrir la heladera y ya no hay vuelta atrás.",
    followerCount: 318,
  },
  {
    id: "pet-coco",
    ownerId: "user-lola",
    name: "Coco",
    image: petImage("coco", 720, 540),
    especie: "gata",
    birthDate: "2022-09-17",
    ageLabel: "3 años",
    description:
      "Café con patas blancas. Se sube a los hombros de cualquiera y se queda ahí como si pagara alquiler.",
    followerCount: 47,
  },

  // --- Sol ---
  {
    id: "pet-nina",
    ownerId: "user-sol",
    name: "Nina",
    image: petImage("nina", 720, 540),
    especie: "coneja",
    birthDate: "2023-04-30",
    ageLabel: "3 años",
    description:
      "Blanca con una oreja caída. Come lechuga como si fuera un problema personal y hace ruido cuando la ignoran.",
    followerCount: 89,
  },
  {
    id: "pet-pipi",
    ownerId: "user-sol",
    name: "Pipi",
    image: petImage("pipi", 720, 540),
    especie: "perro",
    birthDate: "2024-02-11",
    ageLabel: "2 años",
    description:
      "El más pequeño y el más ruidoso. Puppy todavía, con la idea de que todo objeto que toca debería sonar.",
    followerCount: 12,
  },
  {
    id: "pet-roco",
    ownerId: "user-sol",
    name: "Roco",
    image: petImage("roco", 720, 540),
    especie: "loro",
    birthDate: "2018-08-05",
    ageLabel: "8 años",
    description:
      "Habla poco pero lo que dice se escucha en toda la cuadra. Le repetimos 'chau' desde que llegó.",
    followerCount: 203,
  },

  // --- Catalina ---
  {
    id: "pet-bruno",
    ownerId: "user-catalina",
    name: "Bruno",
    image: petImage("bruno", 720, 540),
    especie: "perro",
    birthDate: "2017-01-19",
    ageLabel: "9 años",
    description:
      "El veterano. Ya no corre, camina despacio y mira todo con una tranquilidad que da envidia.",
    followerCount: 156,
  },
  {
    id: "pet-chispa",
    ownerId: "user-catalina",
    name: "Chispa",
    image: petImage("chispa", 720, 540),
    especie: "gata",
    birthDate: "2024-07-21",
    ageLabel: "2 años",
    description:
      "Naranja, pura energía. Trepa cualquier estante disponible y baja todo lo que hay arriba.",
    followerCount: 34,
  },

  // --- Martina ---
  {
    id: "pet-teo",
    ownerId: "user-martina",
    name: "Teo",
    image: petImage("teo", 720, 540),
    especie: "perro",
    birthDate: "2022-12-03",
    ageLabel: "3 años",
    description:
      "Corto de pelo, pelo liso, uno de esos perros que se acomoda en cualquier lugar en diez segundos.",
    followerCount: 97,
  },
  {
    id: "pet-nube",
    ownerId: "user-martina",
    name: "Nube",
    image: petImage("nube", 720, 540),
    especie: "gata",
    birthDate: "2020-05-27",
    ageLabel: "6 años",
    description:
      "Gris azulado, la más silenciosa de todas. Sabe exactamente en qué momento de la tarde hay sol y se instala ahí.",
    followerCount: 61,
  },
  {
    id: "pet-mochi",
    ownerId: "user-martina",
    name: "Mochi",
    image: petImage("mochi", 720, 540),
    especie: "coneja",
    birthDate: "2025-03-08",
    ageLabel: "1 año",
    description:
      "Café con hocico blanco. Tiene dos años pero sigue tratándonos a todos como si fuéramos nuevos.",
    followerCount: 8,
  },
];
