"use client";

import { useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";

export default function AdminGuard({ children }: { children: React.ReactNode }) {
  const { isLoaded, isSignedIn, user } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (!isLoaded) return;
    if (!isSignedIn || user?.publicMetadata?.role !== "admin") {
      router.push("/admin");
    }
  }, [isLoaded, isSignedIn, user, router]);

  if (!isLoaded) {
    return <div className="flex items-center justify-center min-h-screen text-muted-foreground">Cargando...</div>;
  }

  if (!isSignedIn || user?.publicMetadata?.role !== "admin") {
    return <div className="flex items-center justify-center min-h-screen text-muted-foreground">Redirigiendo...</div>;
  }

  return <>{children}</>;
}
