import { NextRequest } from 'next/server'
import { db } from '@/db'
import { customer } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { authenticate } from '@/lib/api-auth'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ customer_id: string }> }
) {
  const authError = authenticate(request)
  if (authError) return authError.error

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
