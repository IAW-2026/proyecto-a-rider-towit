import { NextRequest } from 'next/server'
import { db } from '@/db'
import { trip, customer } from '@/db/schema'
import { eq, or, desc } from 'drizzle-orm'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ trip_id: string }> }
) {
  try {
    const { trip_id: clerk_id } = await params

    const customerRecord = await db.query.customer.findFirst({
      where: eq(customer.clerkId, clerk_id),
      columns: { customerId: true },
    })

    const filters = []

    if (customerRecord) {
      filters.push(eq(trip.customerId, customerRecord.customerId))
    }

    filters.push(eq(trip.towerId, clerk_id))

    const tripRecords = await db.query.trip.findMany({
      where: or(...filters),
      orderBy: [desc(trip.date), desc(trip.time)],
    })

    if (!tripRecords.length) {
      return Response.json(
        { error: 'No trips found for the given clerk_id' },
        { status: 404 }
      )
    }

    const trips = tripRecords.map(t => ({
      trip_id: String(t.tripId),
      customer_id: String(t.customerId),
      vehicle_id: t.vehicleId ?? null,
      tower_id: t.towerId ?? '',
      origin: {
        lat: String(t.originLat),
        long: String(t.originLng),
      },
      destination: {
        lat: String(t.destinationLat),
        long: String(t.destinationLng),
      },
      status: t.status,
      date: String(t.date),
    }))

    return Response.json(trips)
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
