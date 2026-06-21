import { NextRequest } from 'next/server'

export function authenticate(request: NextRequest): { error: Response } | null {
  const apiKey = request.headers.get('x-api-key')
  const expected = process.env.INTERNAL_API_SECRET

  if (!expected) {
    console.error('INTERNAL_API_SECRET is not set')
    return {
      error: Response.json({ error: 'Internal server configuration error' }, { status: 500 }),
    }
  }

  if (!apiKey || apiKey !== expected) {
    return {
      error: Response.json({ error: 'Unauthorized' }, { status: 401 }),
    }
  }

  return null
}
