import { UserButton } from "@clerk/nextjs"
import { currentUser } from "@clerk/nextjs/server"
import Link from "next/link"

export default async function CostumerHome() {
  const user = await currentUser()

  return (
    <div className="flex flex-col min-h-screen bg-white">
      {/* Barra Superior */}
      <nav className="bg-black shadow-lg">
        <div className="max-w-7xl mx-auto px-6 md:px-12 py-4 flex justify-between items-center">
          <Link href="/costumer/home" className="flex items-center gap-2 cursor-pointer">
            <img src="/images/logo/2.svg" alt="TowIt Logo" className="h-8 md:h-10 w-auto" />
            <div className="text-2xl md:text-3xl font-bold text-yellow-200">
              TowIt
            </div>
          </Link>
          <div className="flex items-center gap-4">
            <span className="hidden sm:inline text-yellow-300 font-medium">
              Bienvenido, {user?.firstName}
            </span>
            <UserButton />
          </div>
        </div>
      </nav>

      {/* Contenido Principal */}
      <main className="flex-1">
        <div className="max-w-7xl mx-auto px-6 md:px-12 py-10">
          <header className="mb-8">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900">
              ¿Qué necesitas hoy?
            </h1>
            <p className="text-lg text-gray-600 mt-1">
              Gestiona tus servicios de remolque de forma rápida y sencilla.
            </p>
          </header>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Card: Solicitar Viaje */}
            <div className="bg-gray-50 border-2 border-gray-200 rounded-xl p-6 hover:border-yellow-300 hover:bg-yellow-50 transition-all duration-300 shadow-sm">
              <h3 className="text-2xl font-bold text-gray-800 mb-3">Solicitar un Remolque</h3>
              <p className="text-gray-600 mb-6">
                Inicia una nueva solicitud de grúa. Te conectaremos con el conductor más cercano en minutos.
              </p>
              <button className="w-full px-6 py-3 bg-yellow-300 text-black font-bold rounded-lg hover:bg-yellow-400 transition text-lg duration-200 cursor-pointer">
                Pedir Grúa Ahora
              </button>
            </div>
            
            {/* Card: Mis Viajes */}
            <div className="bg-gray-50 border-2 border-gray-200 rounded-xl p-6 hover:border-yellow-300 hover:bg-yellow-50 transition-all duration-300 shadow-sm">
              <h3 className="text-2xl font-bold text-gray-800 mb-3">Mis Viajes</h3>
              <p className="text-gray-600 mb-6">
                Consulta el historial de tus viajes anteriores y revisa los detalles de los servicios completados.
              </p>
              <button className="w-full px-6 py-3 border-2 border-black text-black font-bold rounded-lg hover:bg-gray-200 transition text-lg duration-200 cursor-pointer">
                Ver Historial
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
