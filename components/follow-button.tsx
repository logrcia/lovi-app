import { toggleFollow } from "@/lib/actions";

/**
 * Botón Seguir / Siguiendo como server component: un form con la server
 * action `toggleFollow` referenciada por `bind` (patrón serializable de
 * Next.js para server actions con argumento dentro de maps). No expone
 * email ni ningún dato privado: solo el id del usuario objetivo viaja en la
 * acción serializada.
 */
export function FollowButton({
  targetUserId,
  isFollowing,
  compact = false,
}: {
  targetUserId: string;
  isFollowing: boolean;
  compact?: boolean;
}) {
  const cls = `${isFollowing ? "btn-ghost-ink" : "btn-ink"}${
    compact ? " !px-3 !py-1 text-[11px]" : ""
  }`;
  return (
    <form action={toggleFollow.bind(null, targetUserId)}>
      <button type="submit" className={cls}>
        {isFollowing ? "Siguiendo" : "Seguir"}
      </button>
    </form>
  );
}