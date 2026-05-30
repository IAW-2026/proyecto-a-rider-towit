import { SignInButton, SignUpButton } from "@clerk/nextjs"
import { currentUser } from "@clerk/nextjs/server"
import Link from "next/link"
import { redirect } from "next/navigation"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { faBolt, faLocationDot, faCreditCard, faUserCheck, faMobileScreenButton, faHeadset } from "@fortawesome/free-solid-svg-icons"
import Footer from "@/components/ui/Footer"

// Add to your globals.css:
// @import url('https://fonts.googleapis.com/css2?family=Geist:wght@400;500;600;700;800;900&display=swap');

export default async function Page() {
  const user = await currentUser()
  if (user) redirect("/costumer/home")

  return (
    <div className="min-h-screen bg-white text-gray-900">

      <nav className="sticky top-0 z-50 bg-[#0A0A0B] border-b border-white/10">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          {/* Logo */}
          <Link href={user ? "/costumer/home" : "/"} className="flex items-center gap-4  cursor-pointer">
          <img src="/images/logo/2.svg" alt="TowIt Logo" className="h-8 md:h-10 w-auto" />
          <div className="text-2xl md:text-3xl font-bold text-white">
            TowIt
          </div>
        </Link>

          {/* Nav actions */}
          <div className="flex items-center gap-2">
            <SignInButton mode="modal" forceRedirectUrl="/costumer/home">
              <button className="rounded-lg px-4 py-2 text-sm font-medium text-white/60 transition-colors hover:bg-white/[0.08] hover:text-white cursor-pointer">
                Iniciar Sesión
              </button>
            </SignInButton>
            <SignUpButton mode="modal" forceRedirectUrl="/costumer/home">
              <button className="rounded-lg bg-[#F5C518] px-4 py-2 text-sm font-semibold text-black transition-all hover:bg-[#E0B214] active:scale-95 cursor-pointer">
                Crear Cuenta
              </button>
            </SignUpButton>
          </div>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section className="relative overflow-hidden bg-white">
        <div className="mx-auto flex max-w-6xl flex-col items-center px-6 pb-20 pt-20 text-center">

          {/* Badge */}
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-gray-200 bg-gray-50 px-4 py-1.5 text-xs font-medium text-gray-500">
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#F5C518] opacity-75" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-[#F5C518]" />
            </span>
            Asistencia disponible ahora mismo
          </div>

          <h1 className="max-w-3xl text-[clamp(40px,7vw,72px)] font-extrabold leading-[1.02] tracking-[-2px] text-gray-900">
            Bienvenido a{" "}
            <span className="text-[#F5C518]">TowIt</span>
          </h1>

          <p className="mt-5 max-w-[460px] text-[17px] leading-relaxed text-gray-500">
            La forma más sencilla de solicitar un remolque. No te quedes varado —
            conectamos tu vehículo con la ayuda más cercana en minutos.
          </p>

          {/* CTAs */}
          <div className="mt-10 flex flex-col items-stretch gap-3 sm:flex-row sm:items-center">
            <SignInButton mode="modal" forceRedirectUrl="/costumer/home">
              <button className="rounded-xl bg-[#F5C518] px-8 py-3.5 text-[15px] font-bold text-black shadow-[0_4px_24px_rgba(245,197,24,0.35)] transition-all hover:bg-[#E0B214] hover:shadow-[0_6px_30px_rgba(245,197,24,0.45)] active:scale-95 cursor-pointer">
                Iniciar Sesión
              </button>
            </SignInButton>
            <SignUpButton mode="modal" forceRedirectUrl="/costumer/home">
              <button className="rounded-xl border-2 border-gray-200 bg-white px-8 py-3.5 text-[15px] font-semibold text-gray-900 transition-all hover:border-gray-300 hover:bg-gray-50 active:scale-95 cursor-pointer">
                Crear Cuenta
              </button>
            </SignUpButton>
          </div>
          
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section className="border-t border-gray-100 bg-gray-50">
        <div className="mx-auto max-w-6xl px-16 py-16">
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.15em] text-[#D4A017]">
            Por qué elegirnos
          </p>
          <h2 className="mb-4 text-[clamp(28px,4vw,42px)] font-extrabold tracking-[-1.5px] leading-tight text-gray-900">
            Todo lo que necesitás,<br />cuando más lo necesitás
          </h2>
          <p className="mb-8 max-w-md text-[16px] leading-relaxed text-gray-500">
            TowIt fue diseñado para que en el peor momento, tengas la mejor experiencia.
          </p>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[
              {
                icon: faBolt,
                title: "Respuesta Inmediata",
                desc: "Tiempo de respuesta promedio menor a 10 minutos. Asistencia disponible 24/7, los 365 días del año.",
              },
              {
                icon: faLocationDot,
                title: "Seguimiento en Vivo",
                desc: "Rastreá la ubicación exacta del conductor en tiempo real. Sabés exactamente cuándo llega.",
              },
              {
                icon: faCreditCard,
                title: "Pago Seguro",
                desc: "Pagos integrados en la app. Sin efectivo, sin sorpresas. Precio confirmado antes de aceptar.",
              },
              {
                icon: faUserCheck,
                title: "Conductores Verificados",
                desc: "Cada conductor pasa por un proceso de verificación riguroso. Tu seguridad es nuestra prioridad.",
              },
              {
                icon: faMobileScreenButton,
                title: "Todo desde la App",
                desc: "Solicitá, rastreá y calificá sin hacer una sola llamada. 100% desde tu teléfono.",
              },
              {
                icon: faHeadset,
                title: "Soporte Siempre",
                desc: "Equipo de soporte disponible en todo momento. Estamos con vos durante todo el servicio.",
              },
            ].map(({ icon, title, desc }) => (
              <div
                key={title}
                className="group rounded-2xl border border-gray-100 bg-white p-6 shadow-sm transition-all duration-200 hover:shadow-md hover:-translate-y-0.5"
              >
                <div className="mb-4 inline-flex h-6 w-6 items-center justify-center rounded-xl text-xl">
                  <FontAwesomeIcon icon={icon} className="text-[#F5C518]" />
                </div>
                <h3 className="mb-2 text-[15px] font-bold text-gray-900">{title}</h3>
                <p className="text-[13px] leading-relaxed text-gray-500">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section className="border-t border-gray-100 bg-white">
        <div className="mx-auto max-w-6xl px-16 py-16">
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.15em] text-[#D4A017]">
            Cómo funciona
          </p>
          <h2 className="mb-8 text-[clamp(28px,4vw,42px)] font-extrabold tracking-[-1.5px] leading-tight text-gray-900">
            Simple, rápido, sin vueltas
          </h2>

          <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-4">
            {[
              {
                n: "01",
                title: "Pedí ayuda",
                desc: "Abrí TowIt, ingresá tu origen, destino y vehículo. Tarda menos de un minuto.",
              },
              {
                n: "02",
                title: "Te asignamos un conductor",
                desc: "TowIt encuentra el conductor verificado más cercano disponible al instante.",
              },
              {
                n: "03",
                title: "Seguí en tiempo real",
                desc: "Hace el siguimiento en vivo hasta que llegue a tu ubicación y luego a destino.",
              },
              {
                n: "04",
                title: "Problema resuelto",
                desc: "Pagá desde la app y calificá el servicio. Sin papeles, sin efectivo.",
              },
            ].map(({ n, title, desc }, i) => (
              <div key={n} className="relative">
                {i < 3 && (
                  <div className="absolute left-full top-5 hidden w-10 border-t-2 border-dashed border-gray-200 lg:block" />
                )}
                <p className="mb-3 text-[42px] font-extrabold leading-none text-[#F5C518]" style={{ fontVariantNumeric: "tabular-nums" }}>
                  {n}
                </p>
                <h3 className="mb-2 text-[15px] font-bold text-gray-900">{title}</h3>
                <p className="text-[13px] leading-relaxed text-gray-500">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Footer />

    </div>
  )
}
