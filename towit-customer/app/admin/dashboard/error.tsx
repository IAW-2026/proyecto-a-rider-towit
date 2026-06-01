"use client"

export default function AdminDashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <main className="max-w-7xl mx-auto px-6 py-16">
      <div className="max-w-md mx-auto text-center space-y-6">
        <div className="text-6xl font-extrabold text-red-400">!</div>
        <h1 className="text-2xl font-bold">Error en el panel</h1>
        <p className="text-muted-foreground text-sm leading-relaxed">
          No se pudieron cargar los datos del panel de administración.
        </p>
        <div className="flex gap-3 justify-center">
          <button
            onClick={reset}
            className="rounded-xl bg-brand-yellow px-6 py-3 text-sm font-bold text-black transition hover:bg-brand-yellow-hover cursor-pointer"
          >
            Reintentar
          </button>
          <a
            href="/admin/dashboard"
            className="rounded-xl border border-border px-6 py-3 text-sm font-medium text-foreground transition hover:bg-muted"
          >
            Volver al dashboard
          </a>
        </div>
      </div>
    </main>
  )
}
