import { LoviWordmark } from "@/components/lovi-wordmark";

export function AuthShell({
  eyebrow,
  children,
}: {
  eyebrow?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="relative flex min-h-dvh items-center justify-center overflow-hidden bg-cream px-4 py-12">
      <div aria-hidden className="zigzag absolute inset-x-0 top-0" />
      <div aria-hidden className="absolute -left-24 top-1/3 h-72 w-72 rounded-full bg-orange/50" />
      <div aria-hidden className="absolute -right-20 top-12 h-60 w-60 rounded-full bg-fucsia/40" />
      <div aria-hidden className="absolute -bottom-16 left-1/4 h-56 w-56 rounded-full bg-butter/60" />
      <div aria-hidden className="absolute bottom-24 right-10 h-24 w-24 rounded-full bg-navy/30" />

      <div className="relative w-full max-w-sm">
        <div className="mb-8">
          <LoviWordmark size="lg" />
          {eyebrow ? (
            <p className="sticker mt-4 bg-butter text-ink">{eyebrow}</p>
          ) : null}
        </div>
        {children}
      </div>
    </div>
  );
}