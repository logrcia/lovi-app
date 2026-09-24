import Link from "next/link";

export function LoviWordmark({
  href,
  size = "md",
  className,
}: {
  href?: string;
  size?: "md" | "lg";
  className?: string;
}) {
  const mark = (
    <span className={`inline-flex items-center gap-1.5 ${className ?? ""}`}>
      <span
        className={`font-display font-semibold italic tracking-tight text-ink ${
          size === "lg" ? "text-4xl" : "text-2xl"
        }`}
      >
        Lo<span className="text-fucsia">vi</span>
      </span>
      <span aria-hidden className="mb-1 h-2 w-2 rotate-45 rounded-[2px] bg-orange" />
    </span>
  );

  if (href) {
    return (
      <Link href={href} aria-label="Lovi — inicio" className="inline-block hover:opacity-80">
        {mark}
      </Link>
    );
  }
  return mark;
}