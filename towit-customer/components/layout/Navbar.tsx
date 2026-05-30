import { UserButton, SignInButton, SignUpButton } from "@clerk/nextjs";
import { currentUser } from "@clerk/nextjs/server";
import Link from "next/link";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faStar } from "@fortawesome/free-solid-svg-icons";
import { getAvgRating } from "@/services/feedbackService";

export default async function Navbar() {
  const user = await currentUser();

  let userRating: number | null = null;
  if (user) {
    try {
      const ratingResult = await getAvgRating(user.id);
      userRating = ratingResult?.avg_rating ?? null;
    } catch (e) {
      console.error("Error fetching user rating:", e);
    }
  }

  return (
    <nav className="bg-black shadow-lg">
      <div className="max-w-7xl mx-auto px-6 md:px-12 py-4 flex justify-between items-center">
        <Link href={user ? "/costumer/home" : "/"} className="flex items-center gap-4 cursor-pointer">
          <img src="/images/logo/2.svg" alt="TowIt Logo" className="h-8 md:h-10 w-auto" />
          <div className="text-2xl md:text-3xl font-bold text-white">
            TowIt
          </div>
        </Link>
        
        {user ? (
          // Contenido para usuarios autenticados
          <div className="flex items-center gap-4">
            <span className="hidden sm:inline text-brand-yellow font-medium">
              Bienvenido, {user.firstName}
            </span>
            {userRating !== null && (
              <div className="flex items-center gap-1 bg-brand-yellow/20 px-2.5 py-1 rounded-lg">
                <FontAwesomeIcon icon={faStar} className="text-sm text-brand-yellow" />
                <span className="text-brand-yellow-dark text-sm font-bold">{userRating}</span>
              </div>
            )}
            <div className="h-8 w-8 rounded-full overflow-hidden flex items-center justify-center">
              <UserButton appearance={{ elements: { rootBox: "rounded-full" } }} />
            </div>
          </div>
        ) : (
          // Contenido para usuarios no autenticados
          <div className="hidden md:flex gap-4">
            <SignInButton mode="modal" forceRedirectUrl="/costumer/home">
              <button className="px-6 py-2 text-brand-yellow font-semibold hover:text-brand-yellow-dark transition cursor-pointer">
                Iniciar Sesión
              </button>
            </SignInButton>
            <SignUpButton mode="modal" forceRedirectUrl="/costumer/home">
              <button className="px-6 py-2 bg-brand-yellow text-black font-semibold rounded-lg hover:bg-brand-yellow-hover transition cursor-pointer">
                Crear Cuenta
              </button>
            </SignUpButton>
          </div>
        )}
      </div>
    </nav>
  );
}
