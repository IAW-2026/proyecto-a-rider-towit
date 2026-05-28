/**
 * paymentService.ts
 * Maneja la comunicación de Customer App hacia Payments App.
 */

const useMocks = () => process.env.USE_MOCKS !== "false";
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export interface PaymentPayload {
  trip_id: number;
  clerk_id: string;
  amount: number;
}

export interface RefundPayload {
  trip_id: string;
  clerk_id: string;
  reason: string;
  refund_type: string;
}

// 1. Generar el pago a realizarse asociado a un viaje
export async function generatePayment(payload: PaymentPayload) {
  if (useMocks()) {
    console.log(`[MOCK - Payments App] Procesando pago por $${payload.amount} del viaje #${payload.trip_id}...`);
    await delay(2000);
    // Retorna el mismo formato de la documentación
    return { 
      transaction_id: "txn_mock_123456789" 
    };
  }

  /*
  const res = await fetch(`${process.env.PAYMENTS_API_URL}/api/payments/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
  return res.json();
  */
}

// 2. Reembolsar dinero de un viaje cancelado
export async function refundPayment(payload: RefundPayload) {
  if (useMocks()) {
    console.log(`[MOCK - Payments App] Generando reembolso para el viaje #${payload.trip_id}. Motivo: ${payload.reason}...`);
    await delay(1500);
    // Retorna el ID de la transacción de reembolso
    return { 
      transaction_id: "ref_mock_987654321" 
    };
  }

  /*
  const res = await fetch(`${process.env.PAYMENTS_API_URL}/api/payments/cancellations/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
  return res.json();
  */
}
