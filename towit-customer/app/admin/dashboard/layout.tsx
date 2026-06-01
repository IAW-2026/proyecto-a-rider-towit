import Navbar from "@/components/layout/Navbar"

export default function AdminDashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar variant="admin" />
      {children}
    </div>
  )
}
