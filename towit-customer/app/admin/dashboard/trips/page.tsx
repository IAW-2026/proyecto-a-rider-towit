import { db } from "@/db";
import { trip, customer } from "@/db/schema";
import { eq, desc, ilike, gte, lte, and, or, sql, count, SQL } from "drizzle-orm";
import Pagination from "@/components/ui/Pagination";
import AdminSearchForm from "@/components/ui/AdminSearchForm";
import Link from "next/link";

const PAGE_SIZE = 15;

export default async function AdminTripsPage(props: { searchParams?: Promise<{ q?: string; from?: string; to?: string; page?: string }> }) {
  const sp = await props.searchParams;
  const query = sp?.q?.trim() || "";
  const from = sp?.from?.trim() || "";
  const to = sp?.to?.trim() || "";
  const currentPage = Math.max(1, Number(sp?.page) || 1);

  const filters: (SQL | undefined)[] = [];

  if (query) {
    const q = `%${query}%`;
    filters.push(
      or(
        ilike(sql`CAST(${trip.tripId} AS TEXT)`, q),
        ilike(trip.originChar, q),
        ilike(trip.DestinationChar, q),
        ilike(trip.status, q),
        ilike(customer.fullName, q),
      )
    );
  }

  if (from) filters.push(gte(trip.date, from));
  if (to) filters.push(lte(trip.date, to));

  const whereFilter = filters.length > 0 ? and(...filters) : undefined;

  const [totalResult] = await db
    .select({ value: count() })
    .from(trip)
    .leftJoin(customer, eq(trip.customerId, customer.customerId))
    .where(whereFilter);

  const totalItems = Number(totalResult.value);
  const totalPages = Math.max(1, Math.ceil(totalItems / PAGE_SIZE));

  const allTrips = await db
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
    .where(whereFilter)
    .orderBy(desc(trip.tripId))
    .limit(PAGE_SIZE)
    .offset((currentPage - 1) * PAGE_SIZE);

  const activeFilters = [query, from, to].filter(Boolean);
  const qp: Record<string, string> = {};
  if (query) qp.q = query;
  if (from) qp.from = from;
  if (to) qp.to = to;

  return (
    <main className="max-w-7xl mx-auto px-6 py-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-foreground">Viajes</h1>
        <Link href="/admin/dashboard" className="text-sm text-brand-yellow-dark hover:text-brand-yellow-hover font-semibold transition">
          ← Volver al Dashboard
        </Link>
      </div>

      <AdminSearchForm
        basePath="/admin/dashboard/trips"
        initialQuery={query}
        initialFrom={from}
        initialTo={to}
        placeholder="Buscar por ID, cliente, origen, destino, estado..."
        showDateRange
      />

      <div className="bg-card rounded-xl shadow-xl overflow-hidden border border-border">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-border">
            <thead className="bg-muted">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Fecha y Hora</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Cliente</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Origen</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Destino</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Estado</th>
              </tr>
            </thead>
            <tbody className="bg-card divide-y divide-border">
              {allTrips.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-sm text-muted-foreground">
                    {activeFilters.length > 0 ? "No se encontraron viajes con esos filtros." : "No hay viajes registrados aún."}
                  </td>
                </tr>
              ) : (
                allTrips.map((info) => (
                  <tr key={info.tripId} className="hover:bg-muted transition">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-foreground">#{info.tripId}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                      {info.date} {info.time}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-foreground">
                      {info.customerName || "Desconocido"}
                    </td>
                    <td className="px-6 py-4 text-sm text-muted-foreground max-w-[240px] truncate" title={info.origin || "Sin origen"}>
                      {info.origin || "—"}
                    </td>
                    <td className="px-6 py-4 text-sm text-muted-foreground max-w-[240px] truncate" title={info.destination || "Sin destino"}>
                      {info.destination || "—"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        info.status === "COMPLETED" ? "bg-green-100 text-green-800" :
                        info.status === "PENDING" ? "bg-yellow-100 text-yellow-800" :
                        info.status === "CANCELLED" ? "bg-red-100 text-red-800" :
                        "bg-gray-100 text-gray-800"
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

        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={totalItems}
          basePath="/admin/dashboard/trips"
          queryParams={qp}
        />
      </div>
    </main>
  );
}
