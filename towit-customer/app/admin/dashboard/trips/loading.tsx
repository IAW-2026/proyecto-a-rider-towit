export default function AdminTripsLoading() {
  return (
    <main className="max-w-7xl mx-auto px-6 py-8">
      <div className="animate-pulse space-y-6">
        <div className="flex items-center justify-between mb-8">
          <div className="h-8 w-32 bg-muted rounded-lg" />
          <div className="h-4 w-36 bg-muted rounded" />
        </div>

        <div className="h-10 w-full bg-muted rounded-lg" />

        <div className="bg-card rounded-xl shadow-xl overflow-hidden border border-border">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-border">
              <thead className="bg-muted">
                <tr>
                  {["ID", "Fecha y Hora", "Cliente", "Origen", "Destino", "Estado"].map((h) => (
                    <th key={h} className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-card divide-y divide-border">
                {Array.from({ length: 10 }).map((_, i) => (
                  <tr key={i}>
                    <td className="px-6 py-4"><div className="h-4 w-12 bg-muted rounded" /></td>
                    <td className="px-6 py-4"><div className="h-4 w-32 bg-muted rounded" /></td>
                    <td className="px-6 py-4"><div className="h-4 w-28 bg-muted rounded" /></td>
                    <td className="px-6 py-4"><div className="h-4 w-40 bg-muted rounded" /></td>
                    <td className="px-6 py-4"><div className="h-4 w-40 bg-muted rounded" /></td>
                    <td className="px-6 py-4"><div className="h-5 w-20 bg-muted rounded-full" /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="px-6 py-4 border-t border-border flex items-center justify-between">
            <div className="h-4 w-40 bg-muted rounded" />
            <div className="flex gap-2">
              <div className="h-8 w-8 bg-muted rounded" />
              <div className="h-8 w-8 bg-muted rounded" />
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
