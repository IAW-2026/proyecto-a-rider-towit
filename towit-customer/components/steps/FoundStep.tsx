"use client";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTruckPickup, faStar } from "@fortawesome/free-solid-svg-icons";

interface FoundStepProps {
  craneTypeLabel: string;
  eta: number;
}

export default function FoundStep({ craneTypeLabel, eta }: FoundStepProps) {
  return (
    <div className="flex flex-col items-center text-center space-y-6 py-8">
      <div className="w-20 h-20 bg-black rounded-full flex items-center justify-center mx-auto shadow-xl ring-4 ring-brand-yellow">
        <div className="mb-5 inline-flex h-14 w-14 items-center justify-center rounded-xl">
          <img src="/images/logo/tow.svg" alt="Tow It" />
        </div>
      </div>

      <h2 className="text-2xl font-extrabold text-black">¡TowIt Encontrado!</h2>

      <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm text-left w-full max-w-sm">
        <p className="text-xs text-gray-500 font-semibold mb-1 tracking-widest uppercase">CONDUCTOR</p>
        <div className="flex justify-between items-center">
          <p className="text-lg font-bold text-gray-900">Pablo • Grúa {craneTypeLabel}</p>
          <div className="bg-gray-100 px-3 py-1 rounded-full">
            <FontAwesomeIcon icon={faStar} className="text-xs text-brand-yellow mr-1" />
            <span className="font-bold text-gray-800 text-sm">4.9</span>
          </div>
        </div>
        <div className="mt-4 pt-4 border-t border-gray-100 flex justify-between items-center">
          <span className="text-gray-600 font-medium">Llegando en</span>
          <span className="text-xl font-bold text-brand-yellow-dark">{eta} min</span>
        </div>
      </div>

    </div>
  );
}
