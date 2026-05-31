import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { vehicle, customer, admin } from "@/db/schema";
import { eq, desc, like, or, sql } from "drizzle-orm";
import Navbar from "@/components/layout/Navbar";
import Link from "next/link";

export default async function AdminVehiclesPage(props: { searchParams?: Promise<{ q?: string }> }) {
  const user = await currentUser();
  if (!user) redirect("/admin");

  const [adminRecord] = await db.select().from(admin).where(eq(admin.clerkId, user.id));
  if (!adminRecord) redirect("/admin");

  const searchParams = await props.searchParams;
  const query = searchParams?.q?.trim() || "";

  const conditions = [];
  if (query) {
    const q = `%${query}%`;
    conditions.push(
      or(
        like(vehicle.brand, q),
        like(vehicle.model, q),
        like(customer.fullName, q),
        like(sql`CAST(${vehicle.year} AS TEXT)`, q),
        like(sql`CAST(${vehicle.vehicleId} AS TEXT)`, q),
      )
    );
  }

  const allVehicles = await db
    .select({
      vehicleId: vehicle.vehicleId,
      brand: vehicle.brand,
      model: vehicle.model,
      year: vehicle.year,
      weight: vehicle.weight,
      customerName: customer.fullName,
    })
    .from(vehicle)
    .leftJoin(customer, eq(vehicle.customerId, customer.customerId))
    .where(conditions.length > 0 ? or(...conditions) : undefined)
    .orderBy(desc(vehicle.vehicleId));

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar variant="admin" />

      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-foreground">Vehículos</h1>
          <Link href="/admin/dashboard" className="text-sm text-brand-yellow-dark hover:text-brand-yellow-hover font-semibold transition">
            ← Volver al Dashboard
          </Link>
        </div>

        <form className="mb-6">
          <div className="relative max-w-md">
            <input
              type="text"
              name="q"
              defaultValue={query}
              placeholder="Buscar por marca, modelo, año, cliente..."
              className="w-full px-4 py-3 pr-10 border-2 border-border rounded-xl text-sm focus:ring-brand-yellow focus:border-brand-yellow outline-none text-foreground bg-card"
            />
            <button type="submit" className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </button>
          </div>
        </form>

        <div className="bg-card rounded-xl shadow-xl overflow-hidden border border-border">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-border">
              <thead className="bg-muted">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">ID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Marca</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Modelo</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Año</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Peso (ton)</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Cliente</th>
                </tr>
              </thead>
              <tbody className="bg-card divide-y divide-border">
                {allVehicles.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-sm text-muted-foreground">
                      {query ? "No se encontraron vehículos con ese criterio." : "No hay vehículos registrados aún."}
                    </td>
                  </tr>
                ) : (
                  allVehicles.map((v) => (
                    <tr key={v.vehicleId} className="hover:bg-muted transition">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-foreground">{v.vehicleId}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-foreground">{v.brand}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">{v.model}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">{v.year}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">{v.weight ? `${v.weight}` : "—"}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">{v.customerName || "Desconocido"}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="px-6 py-3 border-t border-border bg-muted text-sm text-muted-foreground">
            Total: {allVehicles.length} vehículo{allVehicles.length !== 1 ? "s" : ""}
            {query && <> • Filtrado por: <span className="font-medium text-foreground">&ldquo;{query}&rdquo;</span></>}
          </div>
        </div>
      </main>
    </div>
  );
}
