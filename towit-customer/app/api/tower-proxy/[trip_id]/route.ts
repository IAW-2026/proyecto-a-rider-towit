import { NextRequest } from 'next/server'
import { TOWER_API_URL } from '@/lib/constants'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ trip_id: string }> }
) {
  const { trip_id } = await params
  const apiKey = process.env.INTERNAL_API_SECRET

  if (!apiKey) {
    return Response.json(
      { error: 'INTERNAL_API_SECRET no configurada' },
      { status: 500 }
    )
  }

  try {
    const res = await fetch(`${TOWER_API_URL}/api/tower/requests/${trip_id}`, {
      headers: { "x-api-key": apiKey },
    })

    const data = await res.json()
    return Response.json(data, { status: res.status })
  } catch {
    return Response.json(
      { error: 'Error al conectar con TorreApp' },
      { status: 502 }
    )
  }
}
