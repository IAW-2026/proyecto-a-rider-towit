export function formatPrice(price: number) {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
  }).format(price)
}

export function formatDate(dateString: string) {
  try {
    const date = new Date(dateString)
    return new Intl.DateTimeFormat("es-AR", { dateStyle: "medium" }).format(date)
  } catch {
    return dateString
  }
}

export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const R = 6371
  const dLat = (lat2 - lat1) * (Math.PI / 180)
  const dLon = (lon2 - lon1) * (Math.PI / 180)
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

export function subsampleRoute(
  route: [number, number][],
  maxPoints: number,
): [number, number][] {
  if (route.length <= maxPoints) return route
  const sampled: [number, number][] = []
  for (let i = 0; i < maxPoints; i++) {
    const index = Math.floor(
      (i / (maxPoints - 1)) * (route.length - 1),
    )
    sampled.push(route[index])
  }
  return sampled
}

export async function fetchOsrmRoute(
  start: [number, number],
  end: [number, number],
): Promise<[number, number][]> {
  try {
    const url = `https://router.project-osrm.org/route/v1/driving/${start[1]},${start[0]};${end[1]},${end[0]}?overview=full&geometries=geojson`
    const res = await fetch(url)
    const data = await res.json()
    if (data.routes?.length > 0) {
      return data.routes[0].geometry.coordinates.map(
        (coord: [number, number]) => [coord[1], coord[0]] as [number, number],
      )
    }
  } catch (e) {
    console.error("OSRM error:", e)
  }
  return [start, end]
}

export const delay = (ms: number) =>
  new Promise((resolve) => setTimeout(resolve, ms))
