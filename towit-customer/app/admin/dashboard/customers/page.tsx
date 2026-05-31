import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { customer, admin } from "@/db/schema";
import { eq, desc, like, or, sql } from "drizzle-orm";
import Navbar from "@/components/layout/Navbar";
import Link from "next/link";
import { toggleCustomerActive } from "@/app/admin/dashboard/actions";

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

export default async function AdminCustomersPage(props: { searchParams?: Promise<{ q?: string }> }) {
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
        like(customer.fullName, q),
        like(customer.clerkId, q),
        like(sql`CAST(${customer.customerId} AS TEXT)`, q),
      )
    );
  }

  const allCustomers = await db
    .select({
      customerId: customer.customerId,
      fullName: customer.fullName,
      clerkId: customer.clerkId,
      isActive: customer.isActive,
    })
    .from(customer)
    .where(conditions.length > 0 ? or(...conditions) : undefined)
    .orderBy(desc(customer.customerId));

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar variant="admin" />

      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-foreground">Clientes</h1>
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
              placeholder="Buscar por nombre, ID o Clerk ID..."
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

          <div className="px-6 py-3 border-t border-border bg-muted text-sm text-muted-foreground">
            Total: {allCustomers.length} cliente{allCustomers.length !== 1 ? "s" : ""}
            {query && <> • Filtrado por: <span className="font-medium text-foreground">&ldquo;{query}&rdquo;</span></>}
          </div>
        </div>
      </main>
    </div>
  );
}
