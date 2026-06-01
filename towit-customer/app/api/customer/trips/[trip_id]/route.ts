import { NextRequest } from 'next/server'
import { db } from '@/db'
import { trip, customer } from '@/db/schema'
import { eq, desc } from 'drizzle-orm'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ trip_id: string }> }
) {
  try {
    const { trip_id } = await params

    const customerRecord = await db.query.customer.findFirst({
      where: eq(customer.clerkId, trip_id),
      columns: { customerId: true },
    })

    if (!customerRecord) {
      return Response.json(
        { error: 'Customer not found for the given clerk_id' },
        { status: 404 }
      )
    }

    const tripRecord = await db.query.trip.findFirst({
      where: eq(trip.customerId, customerRecord.customerId),
      orderBy: [desc(trip.date), desc(trip.time)],
    })

    if (!tripRecord) {
      return Response.json(
        { error: 'No trips found for this customer' },
        { status: 404 }
      )
    }

    return Response.json({
      trip_id: String(tripRecord.tripId),
      customer_id: String(tripRecord.customerId),
      tower_id: tripRecord.towerId ?? '',
      origin: {
        lat: String(tripRecord.originLat),
        long: String(tripRecord.originLng),
      },
      destination: {
        lat: String(tripRecord.destinationLat),
        long: String(tripRecord.destinationLng),
      },
      status: tripRecord.status,
      date: String(tripRecord.date),
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal server error'
    return Response.json(
      { error: message },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ trip_id: string }> }
) {
  try {
    const { trip_id } = await params
    const body = await request.json()
    const { tower_id, status } = body

    if (!tower_id || !status) {
      return Response.json(
        { error: 'tower_id and status are required' },
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
      .set({ towerId: tower_id, status })
      .where(eq(trip.tripId, Number(trip_id)))

    return Response.json({})
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal server error'
    return Response.json(
      { error: message },
      { status: 500 }
    )
  }
}
