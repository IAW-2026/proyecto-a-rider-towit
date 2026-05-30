import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { trip, customer, vehicle, admin } from "@/db/schema";
import { eq, desc, count } from "drizzle-orm";
import Link from "next/link";
import { SignOutButton } from "@clerk/nextjs";

export default async function AdminDashboard() {
  const user = await currentUser();
  
  if (!user) {
    redirect("/admin");
  }

  // Verificar que el usuario exista en la tabla Admin de Neon
  const [adminRecord] = await db.select().from(admin).where(eq(admin.clerkId, user.id));
  
  if (!adminRecord) {
    // Si no está registrado como admin, redirigir a inicio o vista de cliente
    redirect("/admin");
  }

  const [tripCount] = await db.select({ value: count() }).from(trip);
  const [customerCount] = await db.select({ value: count() }).from(customer);
  const [vehicleCount] = await db.select({ value: count() }).from(vehicle);

  const recentTrips = await db
    .select({
      tripId: trip.tripId,
      date: trip.date,
      time: trip.time,
      origin: trip.originChar,
      destination: trip.DestinationChar,
      status: trip.status,
      customerName: customer.fullName,
    })
    .from(trip)
    .leftJoin(customer, eq(trip.customerId, customer.customerId))
    .orderBy(desc(trip.tripId))
    .limit(20);

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-black text-white px-6 py-4 flex justify-between items-center shadow-md">
        <div className="flex items-center gap-4">
          <Link href="/admin/dashboard" className="text-xl font-bold text-brand-yellow">
            TowIt Admin
          </Link>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-gray-300 text-sm">Administrador: {user.firstName}</span>
          <SignOutButton redirectUrl="/admin" />
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-6 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Dashboard</h1>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          <div className="bg-white rounded-xl shadow p-6 border-l-4 border-brand-yellow">
            <h2 className="text-gray-500 text-sm font-semibold mb-1 uppercase tracking-wide">Viajes Totales</h2>
            <p className="text-4xl font-bold text-gray-900">{tripCount.value}</p>
          </div>
          <div className="bg-white rounded-xl shadow p-6 border-l-4 border-blue-500">
            <h2 className="text-gray-500 text-sm font-semibold mb-1 uppercase tracking-wide">Clientes Registrados</h2>
            <p className="text-4xl font-bold text-gray-900">{customerCount.value}</p>
          </div>
          <div className="bg-white rounded-xl shadow p-6 border-l-4 border-green-500">
            <h2 className="text-gray-500 text-sm font-semibold mb-1 uppercase tracking-wide">Vehículos Registrados</h2>
            <p className="text-4xl font-bold text-gray-900">{vehicleCount.value}</p>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-bold text-gray-900">Últimos Viajes Registrados</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha y Hora</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cliente</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Origen</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Destino</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {recentTrips.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-500">
                      No hay viajes registrados aún.
                    </td>
                  </tr>
                ) : (
                  recentTrips.map((info) => (
                    <tr key={info.tripId} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">#{info.tripId}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {info.date} {info.time}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {info.customerName || "Desconocido"}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate" title={info.origin || "Sin origen guardado"}>
                        {info.origin || "Coordenadas"}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate" title={info.destination || "Sin destino guardado"}>
                        {info.destination || "Coordenadas"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          info.status === 'COMPLETED' ? 'bg-green-100 text-green-800' :
                          info.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {info.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}