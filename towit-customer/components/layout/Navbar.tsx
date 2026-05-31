"use client";

import { UserButton, SignInButton, SignUpButton, useUser } from "@clerk/nextjs";
import Link from "next/link";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faStar } from "@fortawesome/free-solid-svg-icons";
import { getAvgRating } from "@/services/feedbackService";
import { useEffect, useState } from "react";

export default function Navbar() {
  const { user, isLoaded } = useUser();
  const [userRating, setUserRating] = useState<number | null>(null);

  useEffect(() => {
    if (!user) return;
    getAvgRating(user.id).then(r => setUserRating(r?.avg_rating ?? null)).catch(console.error);
  }, [user]);

  if (!isLoaded) {
    return (
      <nav className="bg-black shadow-lg">
        <div className="max-w-7xl mx-auto px-6 md:px-12 py-4 flex justify-between items-center">
          <Link href="/" className="flex items-center gap-4 cursor-pointer">
            <img src="/images/logo/2.svg" alt="TowIt Logo" className="h-8 md:h-10 w-auto" />
            <div className="text-2xl md:text-3xl font-bold text-white">TowIt</div>
          </Link>
        </div>
      </nav>
    );
  }

  return (
    <nav className="bg-black shadow-lg">
      <div className="max-w-7xl mx-auto px-6 md:px-12 py-4 flex justify-between items-center">
        <Link href={user ? "/costumer/home" : "/"} className="flex items-center gap-4 cursor-pointer">
          <img src="/images/logo/2.svg" alt="TowIt Logo" className="h-8 md:h-10 w-auto" />
          <div className="text-2xl md:text-3xl font-bold text-white">TowIt</div>
        </Link>

        {user ? (
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
            <UserButton appearance={{ elements: { userButtonAvatarBox: "!h-8 !w-8 md:!h-10 md:!w-10" } }} />
          </div>
        ) : (
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
