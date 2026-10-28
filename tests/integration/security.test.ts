import 'dotenv/config'
import assert from 'node:assert/strict'
import { spawn, type ChildProcess } from 'node:child_process'
import { randomBytes } from 'node:crypto'
import { once } from 'node:events'
import { setTimeout } from 'node:timers/promises'
import { test } from 'node:test'
import { getPayload } from 'payload'
import config from '../../src/payload.config.js'

// Une base dédiée évite de créer ou supprimer des comptes dans une vraie base.
const databaseName = new URL(process.env.DATABASE_URL ?? '').pathname
if (!databaseName.endsWith('_test')) throw new Error('Les tests exigent une base dédiée avec suffixe _test.')

const base = 'http://127.0.0.1:3100'
const password = randomBytes(24).toString('hex')

async function request(url: string, options?: RequestInit) {
  const response = await fetch(url, options)
  const body = await response.arrayBuffer()
  return new Response(body, { status: response.status, headers: response.headers })
}

test('migrations, authentification et droits réels sur PostgreSQL', async (t) => {
  const payload = await getPayload({ config })
  let server: ChildProcess | undefined
  const createdIDs: number[] = []
  let serverLog = ''
  t.after(async () => {
    if (server && server.exitCode === null) {
      server.kill()
      await Promise.race([once(server, 'exit'), setTimeout(10000, undefined, { ref: false })])
    }
    for (const id of createdIDs.reverse()) {
      await payload.delete({ collection: 'users', id, overrideAccess: true })
    }
    await payload.destroy()
  })

  assert.equal((await payload.count({ collection: 'users', overrideAccess: true })).totalDocs, 0,
    'Utiliser une base de test sans comptes existants.')

  server = spawn(process.execPath, ['node_modules/next/dist/bin/next', 'start', '-H', '127.0.0.1', '-p', '3100'], {
    env: { ...process.env, NODE_ENV: 'production', NEXT_TELEMETRY_DISABLED: '1' },
    stdio: ['ignore', 'pipe', 'pipe'],
  })
  server.stdout?.on('data', (data) => { serverLog += data.toString() })
  server.stderr?.on('data', (data) => { serverLog += data.toString() })

  let ready = false
  for (let attempt = 0; attempt < 90; attempt++) {
    try {
      if ((await request(`${base}/api/health`)).ok) { ready = true; break }
    } catch { /* Le serveur est encore en démarrage. */ }
    if (server.exitCode !== null) break
    await setTimeout(1000)
  }
  assert.ok(ready, `Le serveur de test n'est pas prêt. ${serverLog}`)

  const post = (url: string, body: unknown, token?: string) => request(`${base}${url}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `JWT ${token}` } : {}) },
    body: JSON.stringify(body),
  })

  await t.test('la création publique du premier compte est bloquée sur une base vide', async () => {
    const response = await post('/api/users/first-register', { email: 'intruder@example.invalid', name: 'Intrus', password })
    assert.equal(response.status, 403)
    assert.equal((await payload.count({ collection: 'users', overrideAccess: true })).totalDocs, 0)
    assert.equal((await post('/api/users', { email: 'intruder@example.invalid', name: 'Intrus', password })).status, 403)
  })

  const admin = await payload.create({
    collection: 'users', overrideAccess: true,
    data: { email: 'security-admin@example.invalid', name: 'Test admin', role: 'admin', password },
  })
  createdIDs.push(admin.id)
  const editor = await payload.create({
    collection: 'users', overrideAccess: true,
    data: { email: 'security-editor@example.invalid', name: 'Test éditeur', role: 'editor', password },
  })
  createdIDs.push(editor.id)

  await t.test('connexion administrateur et page CMS', async () => {
    const response = await post('/api/users/login', { email: admin.email, password })
    assert.equal(response.status, 200)
    const result = await response.json()
    assert.ok(result.token)
    assert.match(response.headers.get('set-cookie') ?? '', /HttpOnly/i)
    assert.match(response.headers.get('set-cookie') ?? '', /Secure/i)
    assert.equal((await request(`${base}/admin/login`)).status, 200)
  })

  await t.test('les visiteurs ne peuvent ni lister les comptes ni écrire les réglages', async () => {
    assert.equal((await request(`${base}/api/users`)).status, 403)
    assert.equal((await post('/api/globals/site-settings', { name: 'Intrusion' })).status, 403)
  })

  await t.test('un éditeur ne peut pas lire un autre compte, en créer ou promouvoir son rôle', async () => {
    const login = await post('/api/users/login', { email: editor.email, password })
    assert.equal(login.status, 200)
    const { token } = await login.json()
    const headers = { 'Content-Type': 'application/json', Authorization: `JWT ${token}` }
    const other = await request(`${base}/api/users/${admin.id}`, { headers })
    assert.ok([403, 404].includes(other.status))
    assert.equal((await post('/api/users', { email: 'extra@example.invalid', name: 'Extra', password }, token)).status, 403)
    await request(`${base}/api/users/${editor.id}`, { method: 'PATCH', headers, body: JSON.stringify({ role: 'admin' }) })
    const stored = await payload.findByID({ collection: 'users', id: editor.id, overrideAccess: true })
    assert.equal(stored.role, 'editor')
    assert.equal((await post('/api/globals/site-settings', { name: 'Intrusion' }, token)).status, 403)
  })

  await t.test('un changement du CMS est rendu sur la page publique', async () => {
    const original = await payload.findGlobal({ slug: 'site-settings' })
    try {
      await payload.updateGlobal({ slug: 'site-settings', data: { holdingMessage: 'Message de vérification CMS.' } })
      const response = await request(base)
      assert.equal(response.status, 200)
      assert.match(await response.text(), /Message de vérification CMS\./)
    } finally {
      await payload.updateGlobal({ slug: 'site-settings', data: { holdingMessage: original.holdingMessage } })
    }
  })
})
