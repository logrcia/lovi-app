import Link from "next/link";
import { Sprout, Sparkles } from "lucide-react";

const TONES = {
  orange: { bg: "bg-orange", rotate: "-rotate-3" },
  fucsia: { bg: "bg-fucsia", rotate: "rotate-2" },
  butter: { bg: "bg-butter", rotate: "-rotate-2" },
  navy: { bg: "bg-navy", rotate: "rotate-3" },
} as const;

export function EmptyState({
  tone = "orange",
  title,
  description,
  cta,
  href,
  icon = "sprout",
}: {
  tone?: keyof typeof TONES;
  title: string;
  description?: string;
  cta?: string;
  href?: string;
  icon?: "sprout" | "sparkles";
}) {
  const t = TONES[tone];
  const Icon = icon === "sparkles" ? Sparkles : Sprout;

  return (
    <div className="card-lovi flex flex-col items-center gap-5 px-6 py-12 text-center">
      <div
        className={`flex h-16 w-16 items-center justify-center rounded-full border-2 border-ink ${t.bg} ${t.rotate} shadow-sticker-sm`}
      >
        <Icon size={28} strokeWidth={2.25} className="text-ink" />
      </div>
      <div className="space-y-2">
        <h2 className="font-display text-2xl font-semibold text-ink">{title}</h2>
        {description ? (
          <p className="mx-auto max-w-sm text-sm leading-relaxed text-muted-foreground">
            {description}
          </p>
        ) : null}
      </div>
      {cta && href ? (
        <Link href={href} className="btn-loviar">
          {cta}
        </Link>
      ) : null}
    </div>
  );
}