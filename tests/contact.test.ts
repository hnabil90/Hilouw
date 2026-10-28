import assert from 'node:assert/strict'
import { test } from 'node:test'
import { createContactHandler, type ContactDependencies } from '../src/lib/contact-handler'

const input = { name: 'Test', email: 'test@example.invalid', subject: 'Question', message: 'Un message de vérification.', privacyAcknowledged: true, website: '' }
const request = (body: unknown = input, origin = 'https://hilouw.com') => new Request('https://hilouw.com/api/contact', {
  method: 'POST', headers: { Origin: origin, 'Content-Type': 'application/json' }, body: JSON.stringify(body),
})
const dependencies = (overrides?: Partial<ContactDependencies>): ContactDependencies => ({ origin: 'https://hilouw.com', available: true,
  clientKey: () => 'test-client', limit: async () => true, send: async () => {}, ...overrides })

test('le formulaire refuse une origine étrangère et un honeypot rempli', async () => {
  let sent = false
  const handler = createContactHandler(dependencies({ send: async () => { sent = true } }))
  assert.equal((await handler(request(input, 'https://other.example'))).status, 403)
  assert.equal((await handler(request({ ...input, website: 'spam' }))).status, 400)
  assert.equal(sent, false)
})
test('la validation serveur contrôle les champs et la taille', async () => {
  const handler = createContactHandler(dependencies())
  assert.equal((await handler(request({ ...input, email: 'invalid' }))).status, 400)
  assert.equal((await handler(request({ ...input, message: 'x'.repeat(20000) }))).status, 400)
  assert.equal((await handler(request({ ...input, privacyAcknowledged: false }))).status, 400)
})
test('aucune confirmation en cas de configuration absente, limite ou erreur fournisseur', async () => {
  assert.equal((await createContactHandler(dependencies({ available: false }))(request())).status, 503)
  const limited = await createContactHandler(dependencies({ limit: async () => false }))(request())
  assert.equal(limited.status, 429)
  assert.ok(limited.headers.has('Retry-After'))
  assert.equal((await createContactHandler(dependencies({ send: async () => { throw new Error('provider failed') } }))(request())).status, 502)
})
test('la confirmation suit uniquement l’acceptation du message par le fournisseur', async () => {
  let sent = false
  const response = await createContactHandler(dependencies({ send: async (data, key) => {
    assert.equal(data.email, input.email); assert.ok(key); sent = true
  } }))(request())
  assert.equal(sent, true)
  assert.equal(response.status, 200)
})
