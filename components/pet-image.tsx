import { cn } from "@/lib/utils";

export function PetImage({
  name,
  src,
  className,
  imgClassName,
  tone = "bg-orange",
}: {
  name: string;
  src: string | null;
  className?: string;
  imgClassName?: string;
  tone?: string;
}) {
  const initials = (name.trim()[0] ?? "?").toUpperCase();
  const classes = cn(
    "flex shrink-0 items-center justify-center border-2 border-ink",
    tone,
    className,
  );

  if (src) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={src} alt={name} className={cn(classes, "object-cover", imgClassName)} />;
  }
  return (
    <div className={classes} aria-label={name}>
      <span className="font-display text-2xl font-bold text-ink">{initials}</span>
    </div>
  );
}