import Navbar from "@/components/layout/Navbar";
import Link from "next/link";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faClockRotateLeft, faCarSide } from "@fortawesome/free-solid-svg-icons";
import { currentUser } from "@clerk/nextjs/server";
import Footer from "@/components/ui/Footer";

export default async function CostumerHome() {
  const user = await currentUser();
  const firstName = user?.firstName ?? "bienvenido";

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      <Navbar />

      <main className="flex-1 mx-auto max-w-6xl px-6 py-12 md:px-12">

        {/* Header */}
        <header className="mb-10">
          <h1 className="text-[clamp(28px,4vw,42px)] font-extrabold tracking-[-1.5px] leading-tight text-foreground">
            ¿Qué necesitás hoy,{" "}
            <span className="text-brand-yellow">{firstName}</span>?
          </h1>
          <p className="mt-2 text-[16px] text-muted-foreground">
            Gestioná tus servicios de remolque de forma rápida y sencilla.
          </p>
        </header>

        {/* Cards grid */}
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">

          {/* Card: Solicitar Remolque — highlighted */}
          <div className="group relative flex flex-col overflow-hidden rounded-2xl border-2 border-brand-yellow bg-card p-6 shadow-[0_4px_24px_rgba(245,197,24,0.18)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_8px_36px_rgba(245,197,24,0.28)]">
            <div className="mb-5 inline-flex h-14 w-14 items-center justify-center rounded-xl">
              <img src="/images/logo/tow.svg" alt="Tow It" />
            </div>
            <h3 className="mb-2 text-[18px] font-bold text-foreground">Solicitar un Remolque</h3>
            <p className="mb-6 flex-1 text-[14px] leading-relaxed text-muted-foreground">
              Iniciá una nueva solicitud de grúa. Te conectaremos con el conductor más cercano en minutos.
            </p>
            <Link href="/costumer/request-ride" className="block">
              <button className="w-full rounded-xl bg-brand-yellow py-3 text-[15px] font-bold text-black shadow-[0_2px_12px_rgba(245,197,24,0.3)] transition-all hover:bg-brand-yellow-hover active:scale-95 cursor-pointer">
                Pedir Grúa Ahora
              </button>
            </Link>
          </div>

          {/* Card: Mis Viajes */}
          <div className="group flex flex-col rounded-2xl border border-border bg-card p-6 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-border hover:shadow-md">
            <div className="mb-5 inline-flex h-12 w-12 items-center justify-center rounded-xl">
              <FontAwesomeIcon icon={faClockRotateLeft} className="text-[44px] text-muted-foreground transition-colors group-hover:text-brand-yellow" />
            </div>
            <h3 className="mb-2 text-[18px] font-bold text-foreground">Mis Viajes</h3>
            <p className="mb-6 flex-1 text-[14px] leading-relaxed text-muted-foreground">
              Consultá el historial de tus viajes anteriores y revisá los detalles de cada servicio completado.
            </p>
            <Link href="/costumer/history" className="block">
              <button className="w-full rounded-xl border-2 border-border py-3 text-[15px] font-semibold text-foreground transition-all hover:border-border hover:bg-muted active:scale-95 cursor-pointer">
                Ver Historial
              </button>
            </Link>
          </div>

          {/* Card: Mis Vehículos */}
          <div className="group flex flex-col rounded-2xl border border-border bg-card p-6 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-border hover:shadow-md">
            <div className="mb-5 inline-flex h-12 w-12 items-center justify-center rounded-xl">
              <FontAwesomeIcon icon={faCarSide} className="text-[44px] text-muted-foreground transition-colors group-hover:text-brand-yellow" /></div>
            <h3 className="mb-2 text-[18px] font-bold text-foreground">Mis Vehículos</h3>
            <p className="mb-6 flex-1 text-[14px] leading-relaxed text-muted-foreground">
              Agregá los datos de tu vehículo para agilizar el pedido. Gestioná altas, bajas y modificaciones.
            </p>
            <Link href="/costumer/vehicles" className="block">
              <button className="w-full rounded-xl border-2 border-border py-3 text-[15px] font-semibold text-foreground transition-all hover:border-border hover:bg-muted active:scale-95 cursor-pointer">
                Gestionar Vehículos
              </button>
            </Link>
          </div>

        </div>

        <div className="mt-8 flex flex-wrap items-center gap-4 rounded-2xl border border-border bg-muted px-6 py-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-brand-yellow-dark opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-brand-yellow" />
            </span>
            Servicio operativo
          </div>
          <div className="h-4 w-px bg-border hidden sm:block" />
          <p className="text-sm text-muted-foreground">
            Tiempo promedio de respuesta: <span className="font-semibold text-foreground">8 minutos</span>
          </p>
          <div className="h-4 w-px bg-border hidden sm:block" />
          <p className="text-sm text-muted-foreground">
            Conductores activos: <span className="font-semibold text-foreground">24</span>
          </p>
        </div>

      </main>
      <Footer />
    </div>
    
  );
}
