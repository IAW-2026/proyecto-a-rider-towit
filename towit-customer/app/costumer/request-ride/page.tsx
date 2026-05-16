import Navbar from "@/components/layout/Navbar";
import RequestRideForm from "@/components/rider/RequestRideForm";
import Link from "next/link";

export default async function RequestRidePage() {

  return (
    <div className="flex flex-col min-h-screen bg-white">
      <Navbar />
      <div className="max-w-7xl mx-auto px-6 md:px-12 w-full pt-6">
          <Link href="/costumer/home" className="inline-flex items-center px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 text-sm font-semibold rounded-lg transition-colors duration-200 shadow-sm border border-gray-200">
            <span className="mr-2 leading-none">←</span> Volver atrás
          </Link>
      </div>
      {/* Contenido Principal */}
      <main className="flex-1">
        <div className="max-w-7xl mx-auto px-6 md:px-12 py-10">
          <header className="mb-8">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900">
              Solicitar un Remolque
            </h1>
            <p className="text-lg text-gray-600 mt-1">
              Completa los detalles a continuación para encontrar la grúa más cercana.
            </p>
          </header>

          {/* Formulario y Mapa separado en un Client Component */}
          <RequestRideForm />
        </div>
      </main>
    </div>
  )
}
