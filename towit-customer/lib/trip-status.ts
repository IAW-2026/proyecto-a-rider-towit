export const TRIP_STATUS = {
  PENDING_PAYMENT: "pendiente pago",
  PAYMENT_CONFIRMED: "pago confirmado",
  ACCEPTED: "aceptado",
  IN_PROGRESS: "en proceso",
  COMPLETED: "finalizado",
  CANCELLED: "cancelado",
} as const;

export const TERMINAL_STATUSES = [TRIP_STATUS.COMPLETED, TRIP_STATUS.CANCELLED] as const;
