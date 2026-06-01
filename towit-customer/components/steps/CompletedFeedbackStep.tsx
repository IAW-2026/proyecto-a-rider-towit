"use client";

import { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCircleCheck, faStar } from "@fortawesome/free-solid-svg-icons";

interface CompletedFeedbackStepProps {
  tripId: number;
  onSubmitFeedback: (tripId: number, rating: number) => Promise<{ success: boolean; error?: string }>;
  onFeedbackDone: () => void;
}

export default function CompletedFeedbackStep({ tripId, onSubmitFeedback, onFeedbackDone }: CompletedFeedbackStepProps) {
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [feedbackLoading, setFeedbackLoading] = useState(false);

  const handleSubmit = async () => {
    setFeedbackLoading(true);
    const res = await onSubmitFeedback(tripId, rating);
    setFeedbackLoading(false);
    if (res.success) {
      onFeedbackDone();
    } else {
      alert("Error al enviar calificación: " + (res.error || "desconocido"));
    }
  };

  return (
    <div className="flex flex-col items-center text-center space-y-6 py-8">
      <div className="w-20 h-20 bg-brand-yellow rounded-full flex items-center justify-center mx-auto shadow-lg ring-4 ring-brand-yellow/30">
        <FontAwesomeIcon icon={faCircleCheck} className="text-5xl text-black" />
      </div>

      <h2 className="text-2xl font-extrabold text-foreground">Viaje Finalizado</h2>
      <p className="text-muted-foreground font-medium">
        Tu vehículo llegó a destino. Calificá el servicio para finalizar.
      </p>

      <div className="bg-card rounded-xl p-6 shadow-sm border border-border w-full max-w-sm">
        <p className="text-lg font-bold text-foreground mb-4">Calificá el servicio</p>
        <div className="flex justify-center gap-1 mb-6">
          {[1, 2, 3, 4, 5].map((s) => {
            const active = (hoverRating || rating) >= s;
            return (
              <button
                key={s}
                type="button"
                onMouseEnter={() => setHoverRating(s)}
                onMouseLeave={() => setHoverRating(0)}
                onClick={() => setRating(s)}
                className="cursor-pointer transition-transform hover:scale-110"
              >
                <FontAwesomeIcon
                  icon={faStar}
                  className={`text-4xl transition-colors duration-150 ${active ? "text-brand-yellow" : "text-muted-foreground"}`}
                />
              </button>
            );
          })}
        </div>
        <button
          onClick={handleSubmit}
          disabled={feedbackLoading}
          className="w-full px-6 py-3 bg-brand-yellow text-black font-bold rounded-xl hover:bg-brand-yellow-hover transition text-base duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {feedbackLoading ? "Enviando..." : <>Enviar Calificación</>}
        </button>
      </div>
    </div>
  );
}
