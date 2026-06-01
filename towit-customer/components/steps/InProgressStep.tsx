"use client";

export default function InProgressStep() {
  return (
    <div className="flex flex-col items-center text-center space-y-6 py-8">
      <div className="flex items-center justify-center mx-auto ">
        <div className="mb-1 inline-flex h-14 w-14 items-center justify-center rounded-xl animate-bounce">
          <img src="/images/logo/tow.svg" alt="Tow It" width="56" height="56" />
        </div>
      </div>

      <h2 className="text-2xl font-extrabold text-foreground">Grúa en camino a tu destino</h2>
      <p className="text-muted-foreground font-medium">
        El conductor ya cargó tu vehículo y se dirige hacia el taller indicado.
      </p>
    </div>
  );
}
