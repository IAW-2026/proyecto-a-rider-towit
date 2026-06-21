import { NextRequest } from 'next/server'
import { db } from '@/db'
import { trip } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { authenticate } from '@/lib/api-auth'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ trip_id: string }> }
) {
  const authError = authenticate(request)
  if (authError) return authError.error

  try {
    const { trip_id } = await params
    const body = await request.json()
    const { transaction_id, status } = body

    if (!transaction_id || !status) {
      return Response.json(
        { error: 'transaction_id and status are required' },
        { status: 400 }
      )
    }

    const existingTrip = await db.query.trip.findFirst({
      where: eq(trip.tripId, Number(trip_id)),
    })

    if (!existingTrip) {
      return Response.json(
        { error: 'Trip not found' },
        { status: 404 }
      )
    }

    await db
      .update(trip)
      .set({ status: 'Pago Confirmado' })
      .where(eq(trip.tripId, Number(trip_id)))

     return Response.json({ status: 'pago confirmado' })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal server error'
    return Response.json(
      { error: message },
      { status: 500 }
    )
  }
}
