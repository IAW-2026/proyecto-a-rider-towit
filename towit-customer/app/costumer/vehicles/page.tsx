import Navbar from "@/components/layout/Navbar";
import Link from "next/link";

export default function VehiclesPage() {
  return (
    <div className="flex flex-col min-h-screen bg-white">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-6 md:px-12 w-full pt-6">
        <Link href="/costumer/home" className="inline-flex items-center px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 text-sm font-semibold rounded-lg transition-colors duration-200 shadow-sm border border-gray-200">
          <span className="mr-2 leading-none">←</span> Volver atrás
        </Link>
      </div>

      {/* Contenido Principal */}
      <main className="flex-1 pb-10">
        <div className="max-w-7xl mx-auto px-6 md:px-12 py-10">
          <header className="mb-8 flex justify-between items-center">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900">
                Mis Vehículos
              </h1>
              <p className="text-lg text-gray-600 mt-1">
                Agrega, edita y elimina tus vehículos para agilizar el pedido de remolque.
              </p>
            </div>
            <button className="px-6 py-3 bg-yellow-300 text-black font-bold rounded-lg hover:bg-yellow-400 transition text-lg duration-200 cursor-pointer shadow-sm">
              + Agregar Vehículo
            </button>
          </header>

          <div className="bg-gray-50 border-2 border-gray-200 rounded-xl p-6 text-center text-gray-600 py-16">
            <p className="text-lg mb-4">Aún no tienes vehículos registrados.</p>
            <p>Haz clic en "Agregar Vehículo" para registrar tu primer unidad.</p>
          </div>

          {/* Aquí iría la lista de vehículos registrados */}
        </div>
      </main>
    </div>
  );
}
