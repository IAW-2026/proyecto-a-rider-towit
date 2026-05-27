import { SignInButton, SignUpButton } from "@clerk/nextjs"
import { currentUser } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"

import Navbar from "@/components/layout/Navbar";

export default async function Page() {
  const user = await currentUser()
  
  // Si ya está logueado, redirecciona al home
  if (user) {
    redirect("/costumer/home")
  }

  return (
    <div className="flex flex-col min-h-screen bg-white">
      <Navbar />

      {/* Contenido Principal */}
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row flex-1 w-full">
        {/* Lado Izquierdo - Contenido */}
        <div className="w-full md:w-1/2 flex-1 flex flex-col justify-center items-center md:items-start px-6 md:px-12 py-12 md:py-0 bg-white">
          <div className="max-w-sm w-full text-center md:text-left">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-3 md:mb-4">Bienvenido a TowIt<br/></h1>
            <p className="text-lg md:text-xl font-bold text-gray-800 mb-8 md:mb-2"> La forma más sencilla de solicitar un remolque</p>
            <p className="text-lg md:text-xl text-gray-700 mb-8 md:mb-10"> No te quedes varado. Conectamos tu vehículo con la ayuda más cercana</p>
            <div className="space-y-3">
              <SignInButton mode="modal">
                <button className="w-full px-6 py-3 bg-yellow-300 text-black font-bold rounded-lg hover:bg-yellow-400 transition text-lg duration-200 cursor-pointer">
                  Iniciar Sesión
                </button>
              </SignInButton>
              <SignUpButton mode="modal">
                <button className="w-full px-6 py-3 border-2 border-black text-black font-bold rounded-lg hover:bg-yellow-50 transition text-lg duration-200 cursor-pointer">
                  Crear Cuenta
                </button>
              </SignUpButton>
            </div>
          </div>
        </div>

        {/* Lado Derecho - Imagen (Solo en Desktop/Tablet) */}
        <div className="hidden md:flex w-full md:w-1/2 bg-white items-center justify-center pr-6 md:pr-12">
          <img
            src="/images/hero/hero-gif.gif"
            alt="Towit Ride"
            className="w-full  object-cover"
          />
        </div>
      </div>
    </div>
  )
}
