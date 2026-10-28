import 'server-only'
import { createHmac } from 'node:crypto'
import { isIP } from 'node:net'
import { cms } from './cms'
import type { ContactInput } from './contact-schema'
import { consumeContactRate } from './contact-rate'

export function contactAvailable() {
  return Boolean(process.env.RESEND_API_KEY && process.env.CONTACT_FROM && process.env.CONTACT_TO
    && (process.env.NODE_ENV !== 'production' || process.env.TRUST_PROXY === 'true'))
}

export function clientKey(request: Request): string | null {
  let ip = '127.0.0.1'
  if (process.env.NODE_ENV === 'production') {
    if (process.env.TRUST_PROXY !== 'true') return null
    ip = request.headers.get('x-hilouw-client-ip') || ''
    if (!isIP(ip)) return null
  }
  return createHmac('sha256', process.env.PAYLOAD_SECRET!).update(ip).digest('hex')
}

export async function rateLimitContact(key: string): Promise<boolean> {
  return consumeContactRate((await cms()).db.drizzle, key)
}

export async function sendContact(data: ContactInput, idempotencyKey: string): Promise<void> {
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST', signal: AbortSignal.timeout(15000),
    headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, 'Content-Type': 'application/json', 'Idempotency-Key': idempotencyKey },
    body: JSON.stringify({ from: process.env.CONTACT_FROM, to: [process.env.CONTACT_TO], reply_to: data.email,
      subject: `[HILOUW] ${data.subject}`, text: `Nom : ${data.name}\nEmail : ${data.email}\nSujet : ${data.subject}\n\n${data.message}` }),
  })
  if (!response.ok) throw new Error('Email provider rejected the request')
  const result = await response.json() as { id?: string }
  if (!result.id) throw new Error('Email provider did not acknowledge the message')
}
