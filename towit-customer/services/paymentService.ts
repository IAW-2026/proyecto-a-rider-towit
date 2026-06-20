/**
 * paymentService.ts
 * Maneja la comunicación de Customer App hacia Payments App.
 */

import { USE_MOCK_PAYMENT } from "@/lib/service-utils";
import { delay } from "@/lib/utils";

export interface PaymentPayload {
  tripId: string;
  clerkId: string;
  amount: number;
}

export interface RefundPayload {
  tripId: string;
  clerkId: string;
  refundType: "TOTAL" | "PARTIAL";
}

const PAYMENTS_API_URL = process.env.PAYMENTS_API_URL || "https://payments-towit-six.vercel.app";

// URL para redirigir al usuario a la Payment App a procesar el pago
export function getPaymentUrl(tripId: number, returnUrl: string) {
  const baseUrl = process.env.PAYMENTS_API_URL || "https://payments-towit-six.vercel.app";
  const params = new URLSearchParams({ return_url: returnUrl });
  return `${baseUrl}/payments/${tripId}?${params.toString()}`;
}

// 1. Registrar pago en Payments App (server-to-server)
export async function generatePayment(payload: PaymentPayload) {
  if (USE_MOCK_PAYMENT()) {
    console.log(`[MOCK - Payments App] Registrando pago por $${payload.amount} del viaje #${payload.tripId}...`);
    await delay(2000);
    return {};
  }

  const res = await fetch(`${PAYMENTS_API_URL}/api/payments`, {
    method: "POST",
    redirect: "follow",
    headers: { "Content-Type": "application/json", "Authorization": `Bearer ${process.env.INTERNAL_API_SECRET}` },
    body: JSON.stringify(payload),
  });
  console.log("Payment API response status:", res.status, "Mensaje:", await res.text());
  if (!res.ok) throw new Error(`Payment API error: ${res.status}`);
  return res.json();
}

// 2. Reembolsar dinero de un viaje cancelado
export async function refundPayment(payload: RefundPayload) {
  if (USE_MOCK_PAYMENT()) {
    console.log(`[MOCK - Payments App] Generando reembolso ${payload.refundType} para el viaje #${payload.tripId}...`);
    await delay(1500);
    return { message: "Reembolso exitoso (mock)" };
  }

  const res = await fetch(`${PAYMENTS_API_URL}/api/refunds`, {
    method: "POST",
    redirect: "follow",
    headers: { "Content-Type": "application/json", "Authorization": `Bearer ${process.env.INTERNAL_API_SECRET}` },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(`Payment refund API error: ${res.status}`);
  return res.json();
}
