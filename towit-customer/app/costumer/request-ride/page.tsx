import Navbar from "@/components/layout/Navbar";

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

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Columna del Formulario */}
            <div className="bg-gray-50 border-2 border-gray-200 rounded-xl p-6 shadow-sm">
              <form className="space-y-6">
                {/* Ubicaciones */}
                <div>
                  <label htmlFor="origin" className="block text-lg font-bold text-gray-800 mb-2">Ubicación de Origen</label>
                  <input type="text" id="origin" name="origin" placeholder="Ej: Av. Siempreviva 742" className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-yellow-400 focus:border-yellow-400 transition" />
                </div>
                <div>
                  <label htmlFor="destination" className="block text-lg font-bold text-gray-800 mb-2">Destino</label>
                  <input type="text" id="destination" name="destination" placeholder="Ej: Taller Mecánico 'El Rápido'" className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-yellow-400 focus:border-yellow-400 transition" />
                </div>

                {/* Datos del Vehículo */}
                <div>
                  <label htmlFor="vehicle" className="block text-lg font-bold text-gray-800 mb-2">Datos del Vehículo</label>
                  <input type="text" id="vehicle" name="vehicle" placeholder="Ej: Toyota Corolla 2020, color rojo" className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-yellow-400 focus:border-yellow-400 transition" />
                </div>

                {/* Tipo de Grúa */}
                <div>
                  <label className="block text-lg font-bold text-gray-800 mb-2">Tipo de Grúa</label>
                  <div className="space-y-3">
                    <label className="flex items-center p-4 border-2 border-gray-300 rounded-lg hover:border-yellow-400 cursor-pointer transition">
                      <input type="radio" name="craneType" value="medium" className="h-5 w-5 text-yellow-500 focus:ring-yellow-400"/>
                      <span className="ml-4 text-md font-medium text-gray-700">Vehículo Mediano (Autos, SUVs)</span>
                    </label>
                    <label className="flex items-center p-4 border-2 border-gray-300 rounded-lg hover:border-yellow-400 cursor-pointer transition">
                      <input type="radio" name="craneType" value="large" className="h-5 w-5 text-yellow-500 focus:ring-yellow-400"/>
                      <span className="ml-4 text-md font-medium text-gray-700">Vehículo Grande (Camionetas, Vans)</span>
                    </label>
                    <label className="flex items-center p-4 border-2 border-gray-300 rounded-lg hover:border-yellow-400 cursor-pointer transition">
                      <input type="radio" name="craneType" value="conventional" className="h-5 w-5 text-yellow-500 focus:ring-yellow-400"/>
                      <span className="ml-4 text-md font-medium text-gray-700">Grúa Convencional (Arrastre)</span>
                    </label>
                  </div>
                </div>

                <button type="submit" className="w-full px-6 py-4 bg-yellow-300 text-black font-bold rounded-lg hover:bg-yellow-400 transition text-xl duration-200 cursor-pointer">
                  Confirmar y Buscar Grúa
                </button>
              </form>
            </div>

            {/* Columna del Mapa */}
            <div className="hidden lg:flex items-center justify-center bg-gray-200 rounded-xl shadow-inner">
              <p className="text-gray-500 font-medium">Aquí se mostrará el mapa de Google</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
