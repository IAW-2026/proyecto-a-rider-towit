import { currentUser } from "@clerk/nextjs/server"
import { UserButton } from "@clerk/nextjs"

export default async function CostumerHome() {
  const user = await currentUser()

  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center h-16">
          <h1 className="text-2xl font-bold text-blue-600">Towit</h1>
          <div className="flex items-center gap-4">
            <span className="text-gray-700">Bienvenido, {user?.firstName || user?.emailAddresses[0]?.emailAddress}</span>
            <UserButton />
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-6">Panel del Cliente</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Solicitar Viaje</h3>
            <p className="text-gray-600">Aquí irá el mapa para solicitar un viaje</p>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Mis Viajes</h3>
            <p className="text-gray-600">Histórico de tus viajes</p>
          </div>
        </div>
      </div>
    </div>
  )
}
