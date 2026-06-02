import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import AdminAuth from "./AdminAuth";

export default async function AdminPage() {
  const user = await currentUser();

  if (user?.publicMetadata?.role === "admin") {
    redirect("/admin/dashboard");
  }

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      <nav className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="max-w-7xl mx-auto px-6 md:px-12 py-4 flex justify-between items-center">
          <Link href="/" className="flex items-center gap-2 cursor-pointer">
            <img src="/images/logo/2.svg" alt="TowIt Logo" width="40" height="40" className="h-8 md:h-10 w-auto" />
            <div className="text-2xl md:text-3xl font-bold text-brand-yellow-dark">
              TowIt <span className="text-sm font-normal text-white ml-2">Admin Portal</span>
            </div>
          </Link>
        </div>
      </nav>

      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12">
        <div className="max-w-md w-full text-center">
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">Acceso Administrativo</h1>
          <AdminAuth user={user} />
        </div>
      </div>
    </div>
  );
}
