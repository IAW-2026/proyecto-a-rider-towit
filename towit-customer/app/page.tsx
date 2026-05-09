import Link from "next/link"
import { currentUser } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"

export default async function Page() {
  const user = await currentUser()
  
  // Si ya está logueado, redirecciona al home
  if (user) {
    redirect("/costumer/home")
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-600 to-blue-800">
      <div className="text-center">
        <h1 className="text-5xl font-bold text-white mb-4">Bienvenido a Towit</h1>
        <p className="text-xl text-blue-100 mb-8">Tu app de transporte compartido favorita</p>
        
        <div className="flex gap-4 justify-center">
          <Link href="/auth/sign-in">
            <button className="px-8 py-3 bg-white text-blue-600 font-bold rounded-lg hover:bg-gray-100 transition">
              Iniciar Sesión
            </button>
          </Link>
          <Link href="/auth/sign-up">
            <button className="px-8 py-3 bg-blue-500 text-white font-bold rounded-lg hover:bg-blue-600 transition">
              Crear Cuenta
            </button>
          </Link>
        </div>
      </div>
    </div>
  )
}
