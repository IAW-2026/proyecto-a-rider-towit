import Navbar from "@/components/layout/Navbar"

export default function CustomerLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      <Navbar />
      {children}
    </div>
  )
}
