import { NextRequest } from 'next/server'
import { db } from '@/db'
import { trip } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { authenticate } from '@/lib/api-auth'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ trip_id: string }> }
) {
  const authError = authenticate(request)
  if (authError) return authError.error

  try {
    const { trip_id } = await params

    const tripRecord = await db.query.trip.findFirst({
      where: eq(trip.tripId, Number(trip_id)),
      columns: {
        tripId: true,
      },
    })

    if (!tripRecord) {
      return Response.json(
        { error: 'Trip not found' },
        { status: 404 }
      )
    }

    return Response.json({
      trip_id: String(tripRecord.tripId),
      payment_status: 'pending',
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal server error'
    return Response.json(
      { error: message },
      { status: 500 }
    )
  }
}
