"use client";

import Link from "next/link";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCircleXmark, faHouse } from "@fortawesome/free-solid-svg-icons";

export default function CancelledStep() {
  return (
    <div className="flex flex-col items-center text-center space-y-6 py-8">
      <div className="w-20 h-20 bg-red-900/40 rounded-full flex items-center justify-center mx-auto shadow-lg ring-4 ring-red-900/20">
        <FontAwesomeIcon icon={faCircleXmark} className="text-4xl text-red-400" />
      </div>

      <h2 className="text-2xl font-extrabold text-foreground">Viaje Cancelado</h2>
      <p className="text-muted-foreground font-medium">
        El viaje fue cancelado y se solicitó el reembolso correspondiente.
      </p>

      <div className="flex flex-col gap-3 w-full max-w-sm">
        <button
          onClick={() => window.location.reload()}
          className="w-full px-6 py-4 bg-brand-dark text-white font-bold rounded-xl hover:bg-muted transition shadow-md cursor-pointer"
        >
          Solicitar otra grúa
        </button>

        <Link
          href="/customer/home"
          className="flex items-center justify-center gap-2 w-full px-6 py-4 border-2 border-border text-foreground font-bold rounded-xl hover:bg-muted transition cursor-pointer"
        >
          <FontAwesomeIcon icon={faHouse} className="h-4 w-4" />
          Volver al inicio
        </Link>
      </div>
    </div>
  );
}
