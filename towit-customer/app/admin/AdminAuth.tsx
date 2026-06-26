"use client";

import { useEffect } from "react";
import { useUser, SignIn, SignOutButton } from "@clerk/nextjs";
import { useRouter } from "next/navigation";

export default function AdminAuth() {
  const { isLoaded, isSignedIn, user } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (isLoaded && isSignedIn && user?.publicMetadata?.role === "admin") {
      router.push("/admin/dashboard");
    }
  }, [isLoaded, isSignedIn, user, router]);

  if (!isLoaded) {
    return <p className="text-muted-foreground">Cargando...</p>;
  }

  if (isSignedIn && user?.publicMetadata?.role !== "admin") {
    return (
      <div className="bg-muted border-l-4 border-red-500 text-red-400 p-6 mb-8 text-left rounded shadow-sm">
        <p className="font-bold text-lg mb-2">Acceso Denegado</p>
        <p className="mb-4">Tu cuenta actual no tiene privilegios de administrador para acceder a este portal.</p>
        <div className="mt-4 flex justify-center">
          <SignOutButton redirectUrl="/admin">
            <button className="px-6 py-3 bg-muted-foreground/20 text-foreground font-bold rounded-xl hover:bg-muted-foreground/30 transition text-base duration-200 border border-border cursor-pointer">
              Volver al inicio de sesión
            </button>
          </SignOutButton>
        </div>
      </div>
    );
  }

  if (!isSignedIn) {
    return (
      <>
        <p className="text-lg text-muted-foreground mb-8">Ingresa con tus credenciales asignadas para acceder al panel de control.</p>
        <div className="flex flex-col items-center">
          <SignIn forceRedirectUrl="/admin/dashboard" routing="hash" />
        </div>
      </>
    );
  }

  return <p className="text-muted-foreground">Redirigiendo al panel...</p>;
}
