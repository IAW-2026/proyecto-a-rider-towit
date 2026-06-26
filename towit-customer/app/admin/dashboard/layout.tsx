import Navbar from "@/components/layout/Navbar"
import AdminGuard from "./AdminGuard"

export default function AdminDashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <AdminGuard>
      <div className="min-h-screen bg-background text-foreground">
        <Navbar variant="admin" />
        {children}
      </div>
    </AdminGuard>
  )
}
