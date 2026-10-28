import { createContactHandler } from '@/lib/contact-handler'
import { clientKey, contactAvailable, rateLimitContact, sendContact } from '@/lib/contact-server'
import { serverURL } from '@/lib/environment'

export const runtime = 'nodejs'
export const POST = (request: Request) => createContactHandler({ origin: serverURL(), available: contactAvailable(),
  clientKey, limit: rateLimitContact, send: sendContact })(request)
