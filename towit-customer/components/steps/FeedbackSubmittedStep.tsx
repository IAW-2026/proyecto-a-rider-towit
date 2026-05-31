"use client";

import Link from "next/link";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCircleCheck, faStar } from "@fortawesome/free-solid-svg-icons";

export default function FeedbackSubmittedStep() {
  return (
    <div className="flex flex-col items-center text-center space-y-6 py-8">
      <div className="w-20 h-20 bg-brand-yellow rounded-full flex items-center justify-center mx-auto shadow-lg ring-4 ring-brand-yellow/30">
        <FontAwesomeIcon icon={faCircleCheck} className="text-5xl text-white" />
      </div>

      <h2 className="text-2xl font-extrabold text-black">Calificación enviada</h2>

      <div className="flex justify-center gap-1">
        {[1, 2, 3, 4, 5].map((s) => (
          <FontAwesomeIcon key={s} icon={faStar} className="text-3xl text-brand-yellow" />
        ))}
      </div>

      <p className="text-gray-500 font-medium">Gracias por tu calificación. <br />
       ¡Esperamos verte de nuevo!</p>

      <div>
        <Link href="/costumer/home" className="w-full max-w-sm">
          <button className="w-full px-6 py-4 mb-4 bg-brand-yellow text-white font-bold rounded-xl hover:bg-brand-yellow/80 transition text-base duration-200 shadow-md cursor-pointer">
            Volver al inicio
          </button>
        </Link>

        <button
          onClick={() => window.location.reload()}
          className="w-full max-w-sm px-6 py-4 border-2 border-black text-black font-bold rounded-xl hover:bg-gray-100 transition text-base duration-200 cursor-pointer">
          Solicitar otro viaje
        </button>
      </div>
      
    </div>
  );
}
