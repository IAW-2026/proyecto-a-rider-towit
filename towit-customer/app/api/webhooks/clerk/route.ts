import { Webhook } from 'svix'
import { headers } from 'next/headers'
import { WebhookEvent } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET

  if (!WEBHOOK_SECRET) {
    console.error('CLERK_WEBHOOK_SECRET is not set')
    return NextResponse.json({ error: 'Webhook secret not configured' }, { status: 500 })
  }

  const headerPayload = await headers()
  const svixId = headerPayload.get('svix-id')
  const svixTimestamp = headerPayload.get('svix-timestamp')
  const svixSignature = headerPayload.get('svix-signature')

  if (!svixId || !svixTimestamp || !svixSignature) {
    return NextResponse.json({ error: 'Missing svix headers' }, { status: 400 })
  }

  const payload = await req.text()
  const wh = new Webhook(WEBHOOK_SECRET)

  let evt: WebhookEvent
  try {
    evt = wh.verify(payload, {
      'svix-id': svixId,
      'svix-timestamp': svixTimestamp,
      'svix-signature': svixSignature,
    }) as WebhookEvent
  } catch {
    return NextResponse.json({ error: 'Invalid webhook signature' }, { status: 400 })
  }

  if (evt.type === 'user.created') {
    const { id } = evt.data
    const { clerkClient } = await import('@clerk/nextjs/server')
    const client = await clerkClient()
    await client.users.updateUserMetadata(id, {
      publicMetadata: { role: 'customer' },
    })
    console.log(`[Webhook] User ${id} assigned role "customer"`)
  }

  return NextResponse.json({ success: true })
}
