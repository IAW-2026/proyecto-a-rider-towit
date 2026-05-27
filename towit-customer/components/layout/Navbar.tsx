import { UserButton } from "@clerk/nextjs";
import { currentUser } from "@clerk/nextjs/server";
import Link from "next/link";

export default async function Navbar() {
  const user = await currentUser();

  return (
    <nav className="bg-black shadow-lg">
      <div className="max-w-7xl mx-auto px-6 md:px-12 py-4 flex justify-between items-center">
        <Link href={user ? "/costumer/home" : "/"} className="flex items-center gap-2 cursor-pointer">
          <img src="/images/logo/2.svg" alt="TowIt Logo" className="h-8 md:h-10 w-auto" />
          <div className="text-2xl md:text-3xl font-bold text-yellow-200">
            TowIt
          </div>
        </Link>
        
        {user ? (
          // Contenido para usuarios autenticados
          <div className="flex items-center gap-4">
            <span className="hidden sm:inline text-yellow-300 font-medium">
              Bienvenido, {user.firstName}
            </span>
            <div className="h-8 w-8 rounded-full overflow-hidden flex items-center justify-center">
              <UserButton appearance={{ elements: { rootBox: "rounded-full" } }} />
            </div>
          </div>
        ) : (
          // Contenido para usuarios no autenticados
          <div className="hidden md:flex gap-4">
            <Link href="/auth/sign-in">
              <button className="px-6 py-2 text-yellow-300 font-semibold hover:text-yellow-200 transition cursor-pointer">
                Iniciar Sesión
              </button>
            </Link>
            <Link href="/auth/sign-up">
              <button className="px-6 py-2 bg-yellow-300 text-black font-semibold rounded-lg hover:bg-yellow-200 transition cursor-pointer">
                Crear Cuenta
              </button>
            </Link>
          </div>
        )}
      </div>
    </nav>
  );
}
