import { USE_MOCK_FEEDBACK } from "@/lib/service-utils";
import { delay } from "@/lib/utils";

const FEEDBACK_API_URL = process.env.FEEDBACK_API_URL || "https://proyecto-a-feedback2-towit.vercel.app";

export async function getTripRating(tripId: number, customerId: number) {
  if (USE_MOCK_FEEDBACK()) {
    console.log(`[MOCK - Feedback App] Obteniendo calificación del viaje #${tripId} para customer #${customerId}...`);
    return { rating: 4 };
  }

  const res = await fetch(`${FEEDBACK_API_URL}/api/feedback`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ customer_id: customerId, trip_id: tripId }),
  });
  if (!res.ok) throw new Error(`Feedback API error: ${res.status}`);
  return res.json();
}

export interface SubmitRatingPayload {
  customer_id: number;
  trip_id: number;
  rating: number;
  comment?: string;
}

export async function submitRating(payload: SubmitRatingPayload) {
  if (USE_MOCK_FEEDBACK()) {
    console.log(`[MOCK - Feedback App] Registrando calificación ${payload.rating}★ para viaje #${payload.trip_id}...`);
    await delay(1200);
    return { rating: payload.rating };
  }

  const res = await fetch(`${FEEDBACK_API_URL}/api/feedback`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(`Feedback submit API error: ${res.status}`);
  return res.json();
}

export async function getAvgRating(userId: string) {
  if (USE_MOCK_FEEDBACK()) {
    console.log(`[MOCK - Feedback App] Obteniendo promedio histórico para el conductor ${userId}...`);
    return { avg_rating: 4.8 };
  }

  const res = await fetch(`${FEEDBACK_API_URL}/api/feedback/avg_rating/${userId}`);
  if (!res.ok) throw new Error(`Feedback avg rating API error: ${res.status}`);
  return res.json();
}
