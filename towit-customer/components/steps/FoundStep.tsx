"use client";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faStar } from "@fortawesome/free-solid-svg-icons";

interface FoundStepProps {
  craneTypeLabel: string;
  eta: number;
}

export default function FoundStep({ craneTypeLabel, eta }: FoundStepProps) {
  return (
    <div className="flex flex-col items-center text-center space-y-6 py-8">
      <div className="w-20 h-20 flex items-center justify-center mx-auto">
        <div className="mb-5 inline-flex h-14 w-14 items-center justify-center rounded-xl">
          <img src="/images/logo/tow2.svg" alt="Tow It" width="56" height="56" />
        </div>
      </div>

      <h2 className="text-2xl font-extrabold text-foreground">¡TowIt Encontrado!</h2>

      <div className="bg-card p-5 rounded-xl border border-border shadow-sm text-left w-full max-w-sm">
        <p className="text-xs text-muted-foreground font-semibold mb-1 tracking-widest uppercase">CONDUCTOR</p>
        <div className="flex justify-between items-center">
          <p className="text-lg font-bold text-foreground">Pablo • Grúa {craneTypeLabel}</p>
          <div className="bg-muted px-3 py-1 rounded-full">
            <FontAwesomeIcon icon={faStar} className="text-xs text-brand-yellow mr-1" />
            <span className="font-bold text-foreground text-sm">4.9</span>
          </div>
        </div>
        <div className="mt-4 pt-4 border-t border-border flex justify-between items-center">
          <span className="text-muted-foreground font-medium">Llegando en</span>
          <span className="text-xl font-bold text-brand-yellow-dark">{eta} min</span>
        </div>
      </div>

    </div>
  );
}
