import { USE_MOCK_TOWER } from "@/lib/service-utils";
import { TRIP_STATUS } from "@/lib/trip-status";
import { delay } from "@/lib/utils";

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
}

export async function requestTowerForTrip(payload: TowerRequestPayload) {
  console.log(`[MOCK - Tower App] Solicitando tower para viaje #${payload.trip_id || payload.trip?.id}...`);
  await delay(2000);
  return { tower_id: "tow_mock_001" };
}

export async function getTowerRequestStatus(assignmentId: string) {
  const progress = mockProgressStore.get(assignmentId);
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

export async function getTowerDriverInfo(towerId: string) {
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

export async function cancelTowerRequest(assignmentId: string) {
  console.log(`[MOCK - Tower App] Cancelando asignación #${assignmentId}...`);
  await delay(1500);
  return {};
}
