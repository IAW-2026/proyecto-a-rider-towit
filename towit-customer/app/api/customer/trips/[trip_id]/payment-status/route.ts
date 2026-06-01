import { NextRequest } from 'next/server'
import { db } from '@/db'
import { trip } from '@/db/schema'
import { eq } from 'drizzle-orm'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ trip_id: string }> }
) {
  try {
    const { trip_id } = await params

    const tripRecord = await db.query.trip.findFirst({
      where: eq(trip.tripId, Number(trip_id)),
      columns: {
        tripId: true,
        paymentStatus: true,
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
      payment_status: tripRecord.paymentStatus ?? 'pending',
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal server error'
    return Response.json(
      { error: message },
      { status: 500 }
    )
  }
}
