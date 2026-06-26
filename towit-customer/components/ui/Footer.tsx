import Link from "next/link"

export default function Footer() {
  return (
    <footer className="border-t border-border bg-brand-dark">
      <div className="mx-auto max-w-6xl px-8 py-8">
        <div className="grid grid-cols-2 gap-10 pb-6 lg:grid-cols-4">
          <div className="col-span-2 lg:col-span-1">
            <div className="mb-4 flex items-center gap-2">
              <img
                src="/images/logo/2.svg"
                alt="TowIt Logo"
                width="40" height="40"
                className="h-8 w-auto md:h-10"
                loading="lazy"
              />
              <span className="text-2xl font-bold text-white md:text-3xl">
                TowIt
              </span>
            </div>
            <p className="max-w-[220px] text-[13px] leading-relaxed text-muted-foreground">
              Conectamos tu vehículo con la ayuda más cercana. Disponible en
              toda Argentina.
            </p>
          </div>
        </div>

        <div className="flex flex-col items-start justify-between gap-4 border-t border-white/6 pt-8 sm:flex-row sm:items-center">
          <p className="text-[12px] text-muted-foreground">
            &copy; {new Date().getFullYear()} TowIt. Todos los derechos
            reservados.
          </p>
          <p className="text-[12px] text-muted-foreground">
            Hecho en Argentina - IAW 2026
          </p>
        </div>
      </div>
    </footer>
  )
}
