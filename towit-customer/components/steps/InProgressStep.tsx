"use client";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTruck } from "@fortawesome/free-solid-svg-icons";

export default function InProgressStep() {
  return (
    <div className="flex flex-col items-center text-center space-y-6 py-8">
      <div className="w-20 h-20 bg-brand-yellow rounded-full flex items-center justify-center mx-auto shadow-lg animate-bounce">
        <div className="mb-5 inline-flex h-14 w-14 items-center justify-center rounded-xl">
          <img src="/images/logo/tow.svg" alt="Tow It" />
        </div>
      </div>

      <h2 className="text-2xl font-extrabold text-black">Grúa en camino a tu destino</h2>
      <p className="text-gray-500 font-medium">
        El conductor ya cargó tu vehículo y se dirige hacia el taller indicado.
      </p>
    </div>
  );
}
