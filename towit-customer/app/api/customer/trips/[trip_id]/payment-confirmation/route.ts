import { NextRequest } from 'next/server'
import { db } from '@/db'
import { trip } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { authenticate } from '@/lib/api-auth'
import { TRIP_STATUS } from '@/lib/trip-status'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ trip_id: string }> }
) {
  const authError = authenticate(request)
  if (authError) return authError.error

  try {
    const { trip_id } = await params
    const body = await request.json()
    const { status } = body

    if (!status) {
      return Response.json(
        { error: 'status is required' },
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
      .set({ status: TRIP_STATUS.PAYMENT_CONFIRMED })
      .where(eq(trip.tripId, Number(trip_id)))

     return Response.json({ status: TRIP_STATUS.PAYMENT_CONFIRMED })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal server error'
    return Response.json(
      { error: message },
      { status: 500 }
    )
  }
}
