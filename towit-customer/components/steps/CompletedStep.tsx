"use client";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCircleCheck } from "@fortawesome/free-solid-svg-icons";

export default function CompletedStep() {
  return (
    <div className="flex flex-col items-center text-center space-y-6 py-8">
      <div className="w-20 h-20 bg-brand-yellow rounded-full flex items-center justify-center mx-auto shadow-lg ring-4 ring-brand-yellow/30">
        <FontAwesomeIcon icon={faCircleCheck} className="text-5xl text-black" />
      </div>

      <h2 className="text-2xl font-extrabold text-foreground">Viaje completado</h2>
      <p className="text-muted-foreground font-medium">
        Gracias por viajar con nosotros. Redirigiendo para calificar el servicio...
      </p>
    </div>
  );
}
