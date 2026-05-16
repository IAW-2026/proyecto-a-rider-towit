import Navbar from "@/components/layout/Navbar";
import RequestRideForm from "@/components/rider/RequestRideForm";

export default async function RequestRidePage() {

  return (
    <div className="flex flex-col min-h-screen bg-white">
      <Navbar />

      {/* Contenido Principal */}
      <main className="flex-1">
        <div className="max-w-4xl mx-auto px-6 md:px-12 py-10">
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
