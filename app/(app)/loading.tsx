export default function AppLoading() {
  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-4 px-4 py-10">
      <div className="h-6 w-40 animate-pulse rounded-full bg-ink/10" />
      <div className="h-10 w-72 animate-pulse rounded-lg bg-ink/10" />
      <div className="mt-4 h-32 w-full animate-pulse rounded-2xl bg-ink/10" />
      <div className="mt-2 h-32 w-full animate-pulse rounded-2xl bg-ink/10" />
      <p className="mt-6 text-center text-sm text-muted-foreground">
        Cargando tu diario…
      </p>
    </div>
  );
}