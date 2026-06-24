"use client";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faClock } from "@fortawesome/free-solid-svg-icons";

export default function PaymentPendingStep() {
  return (
    <div className="flex flex-col items-center text-center space-y-6 py-8">
      <div className="space-y-4">
        <div className="animate-pulse w-20 h-20 bg-brand-yellow rounded-full flex items-center justify-center mx-auto shadow-lg">
          <FontAwesomeIcon icon={faClock} className="text-3xl text-black" />
        </div>
        <h2 className="text-2xl font-extrabold text-foreground">Esperando confirmación de pago...</h2>
        <p className="text-muted-foreground font-medium">
          Estamos verificando el pago con el procesador.
        </p>
      </div>
    </div>
  );
}
