"use client";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCircleXmark } from "@fortawesome/free-solid-svg-icons";

interface PaymentFailedStepProps {
  onRetry: () => void;
}

export default function PaymentFailedStep({ onRetry }: PaymentFailedStepProps) {
  return (
    <div className="flex flex-col items-center text-center space-y-6 py-8">
      <div className="w-20 h-20 bg-red-900/40 rounded-full flex items-center justify-center mx-auto shadow-lg ring-4 ring-red-900/20">
        <FontAwesomeIcon icon={faCircleXmark} className="text-4xl text-red-400" />
      </div>

      <h2 className="text-2xl font-extrabold text-foreground">Pago fallido</h2>
      <p className="text-muted-foreground font-medium">
        No se pudo procesar el pago. Intentá de nuevo o cancelá el viaje.
      </p>

      <button
        onClick={onRetry}
        className="w-full max-w-sm px-6 py-3 bg-brand-yellow text-black font-bold rounded-xl hover:bg-brand-yellow/80 transition text-base duration-200 cursor-pointer"
      >
        Reintentar pago
      </button>
    </div>
  );
}