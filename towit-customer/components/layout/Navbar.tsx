"use client";

import { UserButton, SignInButton, SignUpButton, useUser } from "@clerk/nextjs";
import Link from "next/link";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faStar } from "@fortawesome/free-solid-svg-icons";
import { getAvgRating } from "@/services/feedbackService";
import { useEffect, useState } from "react";

export default function Navbar({ variant = "default" }: { variant?: "default" | "admin" }) {
  const { user, isLoaded } = useUser();
  const [userRating, setUserRating] = useState<number | null>(null);

  useEffect(() => {
    if (!user || variant !== "default") return;
    getAvgRating(user.id).then(r => setUserRating(r?.avg_rating ?? null)).catch(console.error);
  }, [user, variant]);

  const brandLink = variant === "admin" ? "/admin/dashboard" : user ? "/customer/home" : "/";
  const brandName = variant === "admin" ? "TowIt Admin" : "TowIt";

  if (!isLoaded) {
    return (
      <nav className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="max-w-7xl mx-auto px-6 md:px-12 py-4 flex justify-between items-center">
          <Link href={brandLink} className="flex items-center gap-4 cursor-pointer">
            <img src="/images/logo/2.svg" alt="TowIt Logo" width="40" height="40" className="h-8 md:h-10 w-auto" />
            <div className="text-2xl md:text-3xl font-bold text-white">{brandName}</div>
          </Link>
        </div>
      </nav>
    );
  }

  return (
    <nav className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
      <div className="max-w-7xl mx-auto px-6 md:px-12 py-4 flex justify-between items-center">
        <Link href={brandLink} className="flex items-center gap-4 cursor-pointer">
          <img src="/images/logo/2.svg" alt="TowIt Logo" width="40" height="40" className="h-8 md:h-10 w-auto" />
          <div className="text-2xl md:text-3xl font-bold text-white">{brandName}</div>
        </Link>

        {user ? (
          <div className="flex items-center gap-4">
            <span className="hidden sm:inline text-brand-yellow font-medium">
              Bienvenido, {user.firstName}
            </span>
            {variant !== "admin" && userRating !== null && (
              <div className="flex items-center gap-1 bg-brand-yellow/10 px-2.5 py-1 rounded-lg border border-brand-yellow/20">
                <FontAwesomeIcon icon={faStar} className="text-sm text-brand-yellow" />
                <span className="text-foreground text-sm font-bold leading-none translate-y-px">{userRating}</span>
              </div>
            )}
            <UserButton appearance={{ elements: { userButtonAvatarBox: "!h-8 !w-8 md:!h-10 md:!w-10" } }} />
          </div>
        ) : (
          <div className="hidden md:flex gap-4">
            <SignInButton mode="modal" forceRedirectUrl="/customer/home">
              <button className="px-6 py-2 text-brand-yellow font-semibold hover:text-brand-yellow-dark transition cursor-pointer">
                Iniciar Sesión
              </button>
            </SignInButton>
            <SignUpButton mode="modal" forceRedirectUrl="/customer/home">
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
