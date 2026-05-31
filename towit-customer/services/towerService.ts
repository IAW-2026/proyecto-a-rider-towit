import { useMocks } from "@/lib/service-utils";
import { delay } from "@/lib/utils";

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

  /*
  const res = await fetch(`${process.env.TOWER_API_URL}/api/tower/vehicles/${vehicleId}`);
  return res.json();
  */
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

  /*
  const res = await fetch(`${process.env.TOWER_API_URL}/api/tower/requests`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
  return res.json();
  */
}

// 3. Consultar estado de tower asignado
export async function getTowerRequestStatus(tripId: string) {
  if (useMocks()) {
    console.log(`[MOCK - Tower App] Consultando estado del viaje #${tripId}...`);
    await delay(1000);
    return {
      status: "en_camino", // simulamos que ya viene
      location: {
        lat: "-38.719",
        long: "-62.268"
      }
    };
  }

  /*
  const res = await fetch(`${process.env.TOWER_API_URL}/api/tower/requests/${tripId}`);
  return res.json();
  */
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

  /*
  const res = await fetch(`${process.env.TOWER_API_URL}/api/tower/drivers/${towerId}`);
  return res.json();
  */
}

// 5. Cancelar pedido de tower
export async function cancelTowerRequest(tripId: string) {
  if (useMocks()) {
    console.log(`[MOCK - Tower App] Cancelando solicitud para el viaje #${tripId}...`);
    await delay(1500);
    return {}; // Según docs, la respuesta es vacía
  }

  /*
  const res = await fetch(`${process.env.TOWER_API_URL}/api/tower/requests/${tripId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({})
  });
  return res.json();
  */
}
