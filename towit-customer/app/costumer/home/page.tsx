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
    <div className="flex flex-col min-h-screen bg-white">
      <Navbar />

      <main className="flex-1 mx-auto max-w-6xl px-6 py-12 md:px-12">

        {/* Header */}
        <header className="mb-10">
          <h1 className="text-[clamp(28px,4vw,42px)] font-extrabold tracking-[-1.5px] leading-tight text-gray-900">
            ¿Qué necesitás hoy,{" "}
            <span className="text-brand-yellow">{firstName}</span>?
          </h1>
          <p className="mt-2 text-[16px] text-gray-500">
            Gestioná tus servicios de remolque de forma rápida y sencilla.
          </p>
        </header>

        {/* Cards grid */}
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">

          {/* Card: Solicitar Remolque — highlighted */}
          <div className="group relative flex flex-col overflow-hidden rounded-2xl border-2 border-brand-yellow bg-white p-6 shadow-[0_4px_24px_rgba(245,197,24,0.18)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_8px_36px_rgba(245,197,24,0.28)]">
            <div className="mb-5 inline-flex h-12 w-12 items-center justify-center rounded-xl">
              <img src="/images/logo/tow.svg" alt="Tow It" className="w-11 h-11" />
            </div>
            <h3 className="mb-2 text-[18px] font-bold text-gray-900">Solicitar un Remolque</h3>
            <p className="mb-6 flex-1 text-[14px] leading-relaxed text-gray-500">
              Iniciá una nueva solicitud de grúa. Te conectaremos con el conductor más cercano en minutos.
            </p>
            <Link href="/costumer/request-ride" className="block">
              <button className="w-full rounded-xl bg-brand-yellow py-3 text-[15px] font-bold text-black shadow-[0_2px_12px_rgba(245,197,24,0.3)] transition-all hover:bg-brand-yellow-hover active:scale-95 cursor-pointer">
                Pedir Grúa Ahora
              </button>
            </Link>
          </div>

          {/* Card: Mis Viajes */}
          <div className="group flex flex-col rounded-2xl border border-gray-100 bg-white p-6 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-gray-200 hover:shadow-md">
            <div className="mb-5 inline-flex h-11 w-11 items-center justify-center rounded-xl  text-2xl transition-colors ">
              <FontAwesomeIcon icon={faClockRotateLeft} className="text-gray-600 transition-colors group-hover:text-brand-yellow" />
            </div>
            <h3 className="mb-2 text-[18px] font-bold text-gray-900">Mis Viajes</h3>
            <p className="mb-6 flex-1 text-[14px] leading-relaxed text-gray-500">
              Consultá el historial de tus viajes anteriores y revisá los detalles de cada servicio completado.
            </p>
            <Link href="/costumer/history" className="block">
              <button className="w-full rounded-xl border-2 border-gray-200 py-3 text-[15px] font-semibold text-gray-900 transition-all hover:border-gray-300 hover:bg-gray-50 active:scale-95 cursor-pointer">
                Ver Historial
              </button>
            </Link>
          </div>

          {/* Card: Mis Vehículos */}
          <div className="group flex flex-col rounded-2xl border border-gray-100 bg-white p-6 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-gray-200 hover:shadow-md">
            <div className="mb-5 inline-flex h-12 w-12 items-center justify-center rounded-xl  text-2xl transition-colors group-hover:text-brand-yellow-dark">
              <FontAwesomeIcon icon={faCarSide} className="text-gray-600 transition-colors group-hover:text-brand-yellow  " /></div>
            <h3 className="mb-2 text-[18px] font-bold text-gray-900">Mis Vehículos</h3>
            <p className="mb-6 flex-1 text-[14px] leading-relaxed text-gray-500">
              Agregá los datos de tu vehículo para agilizar el pedido. Gestioná altas, bajas y modificaciones.
            </p>
            <Link href="/costumer/vehicles" className="block">
              <button className="w-full rounded-xl border-2 border-gray-200 py-3 text-[15px] font-semibold text-gray-900 transition-all hover:border-gray-300 hover:bg-gray-50 active:scale-95 cursor-pointer">
                Gestionar Vehículos
              </button>
            </Link>
          </div>

        </div>

        <div className="mt-8 flex flex-wrap items-center gap-4 rounded-2xl border border-gray-100 bg-gray-50 px-6 py-4">
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-brand-yellow-dark opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-brand-yellow" />
            </span>
            Servicio operativo
          </div>
          <div className="h-4 w-px bg-gray-200 hidden sm:block" />
          <p className="text-sm text-gray-400">
            Tiempo promedio de respuesta: <span className="font-semibold text-gray-700">8 minutos</span>
          </p>
          <div className="h-4 w-px bg-gray-200 hidden sm:block" />
          <p className="text-sm text-gray-400">
            Conductores activos: <span className="font-semibold text-gray-700">24</span>
          </p>
        </div>

      </main>
      <Footer />
    </div>
    
  );
}
