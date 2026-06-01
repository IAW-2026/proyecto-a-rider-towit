"use client"

import Navbar from "@/components/layout/Navbar"
import Footer from "@/components/ui/Footer"

export default function CustomerError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      <Navbar />
      <main className="flex-1 flex items-center justify-center px-6">
        <div className="max-w-md text-center space-y-6">
          <div className="text-6xl font-extrabold text-red-400">!</div>
          <h1 className="text-2xl font-bold">Algo salió mal</h1>
          <p className="text-muted-foreground text-sm leading-relaxed">
            No se pudieron cargar los datos. Por favor intentá de nuevo.
          </p>
          <button
            onClick={reset}
            className="rounded-xl bg-brand-yellow px-6 py-3 text-sm font-bold text-black transition hover:bg-brand-yellow-hover cursor-pointer"
          >
            Reintentar
          </button>
        </div>
      </main>
      <Footer />
    </div>
  )
}
