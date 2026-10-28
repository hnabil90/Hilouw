import { contactSchema, validationErrors, type ContactInput } from './contact-schema'

export type ContactDependencies = {
  origin: string
  available: boolean
  clientKey: (request: Request) => string | null
  limit: (key: string) => Promise<boolean>
  send: (data: ContactInput, idempotencyKey: string) => Promise<void>
}

async function readJSON(request: Request): Promise<unknown> {
  const reader = request.body?.getReader()
  if (!reader) throw new Error('empty')
  let length = 0
  const chunks: Uint8Array[] = []
  while (true) {
    const { value, done } = await reader.read()
    if (done) break
    length += value.length
    if (length > 16000) { await reader.cancel(); throw new Error('large') }
    chunks.push(value)
  }
  const body = new Uint8Array(length)
  let offset = 0
  for (const chunk of chunks) { body.set(chunk, offset); offset += chunk.length }
  return JSON.parse(new TextDecoder().decode(body))
}

export function createContactHandler(deps: ContactDependencies) {
  return async function POST(request: Request): Promise<Response> {
    const response = (body: unknown, status: number, extra?: Record<string, string>) =>
      Response.json(body, { status, headers: { 'Cache-Control': 'no-store', ...extra } })
    if (request.headers.get('origin') !== deps.origin) return response({ error: 'Origine de la demande non autorisée.' }, 403)
    if (!request.headers.get('content-type')?.startsWith('application/json')) return response({ error: 'Format de demande invalide.' }, 415)
    let input: unknown
    try { input = await readJSON(request) }
    catch { return response({ error: 'La demande est invalide ou trop volumineuse.' }, 400) }
    const parsed = contactSchema.safeParse(input)
    if (!parsed.success) return response({ error: 'Vérifiez les champs du formulaire.', fields: validationErrors(parsed.error) }, 400)
    if (!deps.available) return response({ error: 'L’envoi est momentanément indisponible. Réessayez plus tard.' }, 503)
    const key = deps.clientKey(request)
    if (!key) return response({ error: 'La demande n’a pas pu être vérifiée.' }, 403)
    try {
      if (!await deps.limit(key)) return response({ error: 'Trop de messages ont été envoyés. Réessayez dans quelques minutes.' }, 429, { 'Retry-After': '900' })
      await deps.send(parsed.data, crypto.randomUUID())
      return response({ message: 'Votre message a été transmis. Merci de nous avoir écrit.' }, 200)
    } catch {
      return response({ error: 'Votre message n’a pas pu être transmis. Réessayez dans quelques instants.' }, 502)
    }
  }
}
