import { NextRequest } from 'next/server'
import { db } from '@/db'
import { customer } from '@/db/schema'
import { eq } from 'drizzle-orm'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ customer_id: string }> }
) {
  try {
    const { customer_id } = await params

    const isNumeric = /^\d+$/.test(customer_id)

    const customerRecord = await db.query.customer.findFirst({
      where: isNumeric
        ? eq(customer.customerId, Number(customer_id))
        : eq(customer.clerkId, customer_id),
      columns: { fullName: true },
    })

    if (!customerRecord) {
      return Response.json(
        { error: 'Customer not found' },
        { status: 404 }
      )
    }

    return Response.json({ fullname: customerRecord.fullName })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal server error'
    return Response.json(
      { error: message },
      { status: 500 }
    )
  }
}
