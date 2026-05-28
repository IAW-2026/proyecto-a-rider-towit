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
    await delay(800);
    // Simula que el viaje recibió 4 estrellas
    return { rating: 4 };
  }

  /*
  const res = await fetch(`${process.env.FEEDBACK_API_URL}/api/feedback/rating/${tripId}/${userId}`);
  return res.json();
  */
}

// 2. Obtener calificación promedio del conductor
export async function getAvgRating(userId: string) {
  if (useMocks()) {
    console.log(`[MOCK - Feedback App] Obteniendo promedio histórico para el conductor ${userId}...`);
    await delay(1000);
    // Simula el promedio general de un chofer (ej: 4.8 estrellas)
    return { avg_rating: 4.8 };
  }

  /*
  const res = await fetch(`${process.env.FEEDBACK_API_URL}/api/feedback/avg_rating/${userId}`);
  return res.json();
  */
}
