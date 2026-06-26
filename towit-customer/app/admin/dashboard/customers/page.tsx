import { db } from "@/db";
import { customer } from "@/db/schema";
import { desc, ilike, or, sql, count } from "drizzle-orm";
import Pagination from "@/components/ui/Pagination";
import AdminSearchForm from "@/components/ui/AdminSearchForm";
import Link from "next/link";
import { toggleCustomerActive } from "@/app/admin/dashboard/actions";

const PAGE_SIZE = 15;

function ToggleButton({ customerId, isActive }: { customerId: number; isActive: boolean }) {
  return (
    <form action={async () => {
      "use server";
      await toggleCustomerActive(customerId, !isActive);
    }}>
      <button
        type="submit"
        className={`px-3 py-1.5 text-xs font-bold rounded-lg transition cursor-pointer ${
          isActive
            ? "bg-red-100 text-red-700 hover:bg-red-200"
            : "bg-green-100 text-green-700 hover:bg-green-200"
        }`}
      >
        {isActive ? "Deshabilitar" : "Habilitar"}
      </button>
    </form>
  );
}

export default async function AdminCustomersPage(props: { searchParams?: Promise<{ q?: string; page?: string }> }) {
  const sp = await props.searchParams;
  const query = sp?.q?.trim() || "";
  const currentPage = Math.max(1, Number(sp?.page) || 1);

  const conditions = [];
  if (query) {
    const q = `%${query}%`;
    conditions.push(
      or(
        ilike(customer.fullName, q),
        ilike(customer.clerkId, q),
        ilike(sql`CAST(${customer.customerId} AS TEXT)`, q),
      )
    );
  }

  const whereFilter = conditions.length > 0 ? or(...conditions) : undefined;

  const [totalResult] = await db
    .select({ value: count() })
    .from(customer)
    .where(whereFilter);

  const totalItems = Number(totalResult.value);
  const totalPages = Math.max(1, Math.ceil(totalItems / PAGE_SIZE));

  const allCustomers = await db
    .select({
      customerId: customer.customerId,
      fullName: customer.fullName,
      clerkId: customer.clerkId,
      isActive: customer.isActive,
    })
    .from(customer)
    .where(whereFilter)
    .orderBy(desc(customer.customerId))
    .limit(PAGE_SIZE)
    .offset((currentPage - 1) * PAGE_SIZE);

  const qp: Record<string, string> = {};
  if (query) qp.q = query;

  return (
    <main className="max-w-7xl mx-auto px-6 py-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-foreground">Clientes</h1>
        <Link href="/admin/dashboard" className="text-sm text-brand-yellow-dark hover:text-brand-yellow-hover font-semibold transition">
          ← Volver al Dashboard
        </Link>
      </div>

      <AdminSearchForm
        basePath="/admin/dashboard/customers"
        initialQuery={query}
        placeholder="Buscar por nombre, ID o Clerk ID..."
      />

      <div className="bg-card rounded-xl shadow-xl overflow-hidden border border-border">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-border">
            <thead className="bg-muted">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Nombre</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Clerk ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Estado</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Acción</th>
              </tr>
            </thead>
            <tbody className="bg-card divide-y divide-border">
              {allCustomers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-sm text-muted-foreground">
                    {query ? "No se encontraron clientes con ese criterio." : "No hay clientes registrados aún."}
                  </td>
                </tr>
              ) : (
                allCustomers.map((c) => (
                  <tr key={c.customerId} className="hover:bg-muted transition">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-foreground">{c.customerId}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-foreground">{c.fullName}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground font-mono max-w-[200px] truncate" title={c.clerkId}>
                      {c.clerkId}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        c.isActive ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                      }`}>
                        {c.isActive ? "Activo" : "Inactivo"}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <ToggleButton customerId={c.customerId} isActive={c.isActive} />
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
          basePath="/admin/dashboard/customers"
          queryParams={qp}
        />
      </div>
    </main>
  );
}
