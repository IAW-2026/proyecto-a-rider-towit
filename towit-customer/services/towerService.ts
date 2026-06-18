import { useMocks } from "@/lib/service-utils";
import { delay } from "@/lib/utils";

const TOWER_API_URL = process.env.TOWER_API_URL || "https://proyecto-a-driver2-towit.vercel.app";

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
  if (!useMocks()) return;
  mockProgressStore.set(tripId, { pointsToOrigin, pointsToDest, step: startStep, phase: startPhase });
}

export function clearMockTripProgress(tripId: string) {
  mockProgressStore.delete(tripId);
}

// 1. Obtener datos de vehículo de Tower
export async function getTowerVehicle(vehicleId: string) {
  if (useMocks()) {
    console.log(`[MOCK - Tower App] Obteniendo vehículo ${vehicleId}...`);
    await delay(1000);
    return {
      tower_id: "tow_987",
      brand: "Mercedes-Benz",
      model: "Atego 815",
      year: 2020,
      max_load: 5000
    };
  }

  const res = await fetch(`${TOWER_API_URL}/api/tower/vehicles/${vehicleId}`);
  if (!res.ok) throw new Error(`Tower API error: ${res.status}`);
  return res.json();
}

// 2. Solicitar tower para viaje
export interface TowerRequestPayload {
  customer_id: string;
  trip: {
    id: string;
    origin: { lat: string; long: string };
    destination: { lat: string; long: string };
  };
  vehicle_data: { brand: string; model: string; year: number };
  preferred_tow_type?: string;
}

export async function requestTowerForTrip(payload: TowerRequestPayload) {
  if (useMocks()) {
    console.log(`[MOCK - Tower App] Solicitando tower para viaje #${payload.trip.id}...`);
    await delay(2000);
    return { tower_id: "tow_mock_001" };
  }

  const res = await fetch(`${TOWER_API_URL}/api/tower/requests`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(`Tower request API error: ${res.status}`);
  return res.json();
}

// 3. Consultar estado de tower asignado
export async function getTowerRequestStatus(tripId: string) {
  if (useMocks()) {
    const progress = mockProgressStore.get(tripId);
    if (!progress) {
      return { status: "en_camino", location: null };
    }

    const points = progress.phase === "arriving" ? progress.pointsToOrigin : progress.pointsToDest;

    if (progress.step >= points.length) {
      if (progress.phase === "arriving") {
        progress.phase = "traveling";
        progress.step = 0;
        return { status: "recogiendo", location: null };
      }
      return { status: "finalizado", location: null };
    }

    const location = points[progress.step];
    progress.step++;

    return {
      status: progress.phase === "arriving" ? "en_camino" : "en_viaje",
      location: { lat: String(location[0]), long: String(location[1]) },
      totalPoints: points.length,
      currentStep: progress.step,
    };
  }

  const res = await fetch(`${TOWER_API_URL}/api/tower/requests/${tripId}`);
  if (!res.ok) throw new Error(`Tower status API error: ${res.status}`);
  return res.json();
}

// 4. Obtener datos del conductor/tower asignado
export async function getTowerDriverInfo(towerId: string) {
  if (useMocks()) {
    console.log(`[MOCK - Tower App] Obteniendo info del conductor ${towerId}...`);
    return {
      tower_id: towerId,
      driver_name: "Carlos Rodríguez",
      driver_phone: "+54 11 5555-1234",
      vehicle_brand: "Mercedes-Benz",
      vehicle_model: "Atego 815",
      vehicle_year: 2020,
      driver_rating: 4.9
    };
  }

  const res = await fetch(`${TOWER_API_URL}/api/tower/drivers/${towerId}`);
  if (!res.ok) throw new Error(`Tower driver API error: ${res.status}`);
  return res.json();
}

// 5. Cancelar pedido de tower
export async function cancelTowerRequest(tripId: string) {
  if (useMocks()) {
    console.log(`[MOCK - Tower App] Cancelando solicitud para el viaje #${tripId}...`);
    await delay(1500);
    return {};
  }

  const res = await fetch(`${TOWER_API_URL}/api/tower/requests/${tripId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({}),
  });
  if (!res.ok) throw new Error(`Tower cancel API error: ${res.status}`);
  return res.json();
}
