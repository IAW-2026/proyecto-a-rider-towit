import { USE_MOCK_TOWER } from "@/lib/service-utils";
import { TOWER_API_URL } from "@/lib/constants";
import { TRIP_STATUS } from "@/lib/trip-status";
import { delay } from "@/lib/utils";

const API_KEY = process.env.INTERNAL_API_SECRET || "";

const TOWER_REQUESTS_URL = `${TOWER_API_URL}/api/tower/requests`;

interface MockTripProgress {
  pointsToOrigin: [number, number][];
  pointsToDest: [number, number][];
  step: number;
  phase: "arriving" | "traveling";
}

const mockProgressStore = new Map<string, MockTripProgress>();

export function initMockTripProgress(
  tripId: string,
  pointsToOrigin: [number, number][],
  pointsToDest: [number, number][],
  startStep = 0,
  startPhase: "arriving" | "traveling" = "arriving",
) {
  mockProgressStore.set(tripId, { pointsToOrigin, pointsToDest, step: startStep, phase: startPhase });
}

export function clearMockTripProgress(tripId: string) {
  mockProgressStore.delete(tripId);
}

export async function getTowerVehicle(_vehicleId: string) {
  console.log(`[MOCK - Tower App] Obteniendo vehículo ${_vehicleId}...`);
  await delay(1000);
  return {
    tower_id: "tow_987",
    brand: "Mercedes-Benz",
    model: "Atego 815",
    year: 2020,
    max_load: 5000,
  };
}

export interface TowerRequestPayload {
  trip_id?: string;
  customer_id?: string;
  trip?: { id: string; origin: { lat: string; long: string }; destination: { lat: string; long: string } };
  vehicle_data?: { brand: string; model: string; year: number };
  preferred_tow_type?: string;
}

interface TowerRequestResponse {
  success: boolean;
  data?: {
    trip_id: string;
    status: string;
  };
  error?: string;
  details?: Record<string, unknown>;
}

export type TowerResponse = Record<string, unknown>;

export async function requestTowerForTrip(payload: TowerRequestPayload): Promise<TowerResponse> {
  if (USE_MOCK_TOWER()) {
    console.log(`[MOCK - Tower App] Solicitando tower para viaje #${payload.trip_id || payload.trip?.id}...`);
    await delay(2000);
    return { tower_id: "tow_mock_001" };
  }

  const body: Record<string, unknown> = {
    customer_id: payload.customer_id,
    trip: payload.trip,
    vehicle_data: payload.vehicle_data,
  };
  if (payload.preferred_tow_type) {
    body.preferred_tow_type = payload.preferred_tow_type;
  }

  const res = await fetch(TOWER_REQUESTS_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": API_KEY,
    },
    body: JSON.stringify(body),
  });

  const response: TowerRequestResponse = await res.json();

  if (!res.ok) {
    throw new Error(response.error || `Error al solicitar tower: ${res.status}`);
  }

  return (response.data ?? {}) as TowerResponse;
}

interface TowerRequestStatusResponse {
  success: boolean;
  data?: {
    status: string;
    location: { lat: string; long: string } | null;
  };
  error?: string;
}

export async function getTowerRequestStatus(tripId: string) {
  if (USE_MOCK_TOWER()) {
    const progress = mockProgressStore.get(tripId);
    if (!progress) {
      return { status: TRIP_STATUS.IN_PROGRESS, phase: "en_camino", location: null };
    }

    const points = progress.phase === "arriving" ? progress.pointsToOrigin : progress.pointsToDest;

    if (progress.step >= points.length) {
      if (progress.phase === "arriving") {
        progress.phase = "traveling";
        progress.step = 0;
        return { status: TRIP_STATUS.IN_PROGRESS, phase: "recogiendo", location: null };
      }
      return { status: TRIP_STATUS.COMPLETED, phase: "finalizado", location: null };
    }

    const location = points[progress.step];
    progress.step++;

    return {
      status: TRIP_STATUS.IN_PROGRESS,
      phase: progress.phase === "arriving" ? "en_camino" : "en_viaje",
      location: { lat: String(location[0]), long: String(location[1]) },
      totalPoints: points.length,
      currentStep: progress.step,
    };
  }

  const res = await fetch(`${TOWER_REQUESTS_URL}/${tripId}`, {
    method: "GET",
    headers: {
      "x-api-key": API_KEY,
    },
  });

  const response: TowerRequestStatusResponse = await res.json();

  if (!res.ok) {
    if (res.status === 404) {
      return { status: "not_found", location: null };
    }
    throw new Error(response.error || `Error al consultar estado: ${res.status}`);
  }

  const data = response.data;
  if (!data) {
    return { status: "unknown", location: null };
  }

  const statusMap: Record<string, string> = {
    pending: TRIP_STATUS.PAYMENT_CONFIRMED,
    accepted: TRIP_STATUS.IN_PROGRESS,
    completed: TRIP_STATUS.COMPLETED,
    cancelled: TRIP_STATUS.CANCELLED,
  };

  return {
    status: statusMap[data.status] || data.status,
    location: data.location,
  };
}

export async function getTowerDriverInfo(towerId: string) {
  if (USE_MOCK_TOWER()) {
    console.log(`[MOCK - Tower App] Obteniendo info del conductor ${towerId}...`);
    return {
      tower_id: towerId,
      driver_name: "Carlos Rodríguez",
      driver_phone: "+54 11 5555-1234",
      vehicle_brand: "Mercedes-Benz",
      vehicle_model: "Atego 815",
      vehicle_year: 2020,
      driver_rating: 4.9,
    };
  }

  const res = await fetch(`${TOWER_API_URL}/api/tower/drivers/${towerId}`, {
    headers: {
      "x-api-key": API_KEY,
    },
  });

  if (!res.ok) {
    throw new Error(`Error al obtener info del conductor: ${res.status}`);
  }

  return res.json();
}

interface CancelTowerResponse {
  success: boolean;
  data?: {
    assignment_id: string;
    trip_id: string;
    tower_id: string;
    status: string;
    location: { lat: string; long: string };
    createdAt: string;
    updatedAt: string;
  };
  error?: string;
}

export async function cancelTowerRequest(tripId: string) {
  if (USE_MOCK_TOWER()) {
    console.log(`[MOCK - Tower App] Cancelando viaje #${tripId}...`);
    await delay(1500);
    return {};
  }

  const res = await fetch(`${TOWER_REQUESTS_URL}/${tripId}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": API_KEY,
    },
    body: JSON.stringify({}),
  });

  const response: CancelTowerResponse = await res.json();

  if (!res.ok) {
    throw new Error(response.error || `Error al cancelar solicitud: ${res.status}`);
  }

  return response.data || {};
}
