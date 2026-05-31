import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { SignIn, SignOutButton } from "@clerk/nextjs";
import Link from "next/link";
import { db } from "@/db";
import { admin } from "@/db/schema";
import { eq } from "drizzle-orm";

export default async function AdminPage() {
  const user = await currentUser();
  let isUnauthorized = false;
  
  if (user) {
    // Verificamos si el usuario activo es realmente un Administrador
    const [adminRecord] = await db.select().from(admin).where(eq(admin.clerkId, user.id));
    if (adminRecord) {
      redirect("/admin/dashboard");
    } else {
      isUnauthorized = true;
    }
  }

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      {/* Navbar estilo similar a la principal */}
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

      {/* Controles de Inicio de Sesión / Error */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12">
        <div className="max-w-md w-full text-center">
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">Acceso Administrativo</h1>

          {isUnauthorized ? (
            <div className="bg-muted border-l-4 border-red-500 text-red-400 p-6 mb-8 text-left rounded shadow-sm">
              <p className="font-bold text-lg mb-2">Acceso Denegado</p>
              <p className="mb-4">Tu cuenta actual no tiene privilegios de administrador para acceder a este portal.</p>
              <div className="mt-4">
                <SignOutButton redirectUrl="/admin" />
              </div>
            </div>
          ) : (
            <>
              <p className="text-lg text-muted-foreground mb-8">Ingresa con tus credenciales asignadas para acceder al panel de control.</p>
              <div className="flex flex-col items-center">
                <SignIn forceRedirectUrl="/admin/dashboard" routing="hash" />
              </div>
            </>
          )}

        </div>
      </div>
    </div>
  );
}