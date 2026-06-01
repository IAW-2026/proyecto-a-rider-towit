export default function AdminDashboardLoading() {
  return (
    <main className="max-w-7xl mx-auto px-6 py-8">
      <div className="animate-pulse space-y-6">
        <div className="h-8 w-48 bg-muted rounded-lg" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-28 bg-muted rounded-xl" />
          ))}
        </div>
        <div className="h-64 bg-muted rounded-xl" />
      </div>
    </main>
  )
}
