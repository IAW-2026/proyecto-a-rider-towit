export const OSRM_BASE_URL = "https://router.project-osrm.org/route/v1/driving"

export const PAYMENT_APP_URL = process.env.NEXT_PUBLIC_PAYMENT_APP_URL || "https://payments-towit-six.vercel.app"
export const FEEDBACK_APP_URL = process.env.NEXT_PUBLIC_FEEDBACK_APP_URL || "https://proyecto-a-feedback2-towit.vercel.app"

export const NOMINATIM_SEARCH_URL = "https://nominatim.openstreetmap.org/search"
export const NOMINATIM_REVERSE_URL = "https://nominatim.openstreetmap.org/reverse"

export const NOMINATIM_USER_AGENT = "TowIt-Client-App (contact@towit.com)"
export const NOMINATIM_COUNTRY = "ar"

export const DEFAULT_MAP_CENTER: [number, number] = [-38.7333, -62.2667]
export const TOW_TRUCK_ICON = "/images/fiestajejes.png"

export const WEIGHT_LIMITS: Record<string, number> = {
  medium: 2,
  large: 4.5,
  conventional: Infinity,
}

export const CRANE_RATES: Record<string, { base: number; perKm: number }> = {
  medium: { base: 12000, perKm: 1500 },
  large: { base: 15000, perKm: 1800 },
  conventional: { base: 18000, perKm: 2200 },
}

export const EARTH_RADIUS_KM = 6371

export const ANIMATION_POINTS_TO_ORIGIN = 20
export const ANIMATION_POINTS_TO_DEST = 30
export const SEARCH_DELAY_MS = 3000
export const MOCK_ETA_MINUTES = 7

export const ADDRESS_DEBOUNCE_MS = 600
export const GEOCODE_QUEUE_DELAY_MS = 1000

export const CRANE_TYPES = [
  { key: "medium" as const, label: "Vehículo Mediano", desc: "Hasta 2 toneladas" },
  { key: "large" as const, label: "Vehículo Grande", desc: "Hasta 4,5 toneladas" },
  { key: "conventional" as const, label: "Grúa Convencional", desc: "Sin límite de peso" },
]
