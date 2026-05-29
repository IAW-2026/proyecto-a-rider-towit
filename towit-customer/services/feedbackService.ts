/**
 * feedbackService.ts
 * Maneja la comunicación de Customer App hacia Feedback App.
 */

const useMocks = () => process.env.USE_MOCKS !== "false";
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// 1. Obtener calificación dada en un servicio específico
export async function getTripRating(tripId: string, userId: string) {
  if (useMocks()) {
    console.log(`[MOCK - Feedback App] Obteniendo la calificación del viaje #${tripId} para el usuario ${userId}...`);
    return { rating: 4 };
  }

  /*
  const res = await fetch(`${process.env.FEEDBACK_API_URL}/api/feedback/rating/${tripId}/${userId}`);
  return res.json();
  */
}

// 3. Enviar calificación para un viaje completado
export interface SubmitRatingPayload {
  trip_id: string;
  customer_id: string;
  driver_id?: string;
  rating: number;
  comment?: string;
}

export async function submitRating(payload: SubmitRatingPayload) {
  if (useMocks()) {
    console.log(`[MOCK - Feedback App] Registrando calificación ${payload.rating}★ para viaje #${payload.trip_id}...`);
    await delay(1200);
    return {
      feedback_id: `fb_mock_${Date.now()}`,
      status: "submitted"
    };
  }

  /*
  const res = await fetch(`${process.env.FEEDBACK_API_URL}/api/feedback/rating`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
  return res.json();
  */
}

// 2. Obtener calificación promedio del conductor
export async function getAvgRating(userId: string) {
  if (useMocks()) {
    console.log(`[MOCK - Feedback App] Obteniendo promedio histórico para el conductor ${userId}...`);
    return { avg_rating: 4.8 };
  }

  /*
  const res = await fetch(`${process.env.FEEDBACK_API_URL}/api/feedback/avg_rating/${userId}`);
  return res.json();
  */
}
