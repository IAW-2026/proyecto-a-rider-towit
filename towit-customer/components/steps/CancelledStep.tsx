"use client";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCircleXmark } from "@fortawesome/free-solid-svg-icons";

export default function CancelledStep() {
  return (
    <div className="flex flex-col items-center text-center space-y-6 py-8">
      <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto shadow-lg ring-4 ring-red-50">
        <FontAwesomeIcon icon={faCircleXmark} className="text-4xl text-red-500" />
      </div>

      <h2 className="text-2xl font-extrabold text-foreground">Viaje Cancelado</h2>
      <p className="text-muted-foreground font-medium">
        El viaje fue cancelado y se solicitó el reembolso correspondiente.
      </p>

      <button
        onClick={() => window.location.reload()}
        className="w-full max-w-sm px-6 py-4 bg-brand-dark text-white font-bold rounded-xl hover:bg-muted transition shadow-md cursor-pointer"
      >
        Solicitar otra grúa
      </button>
    </div>
  );
}
