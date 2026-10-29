import 'dotenv/config'
import assert from 'node:assert/strict'
import { spawn, type ChildProcess } from 'node:child_process'
import { randomBytes } from 'node:crypto'
import { once } from 'node:events'
import { setTimeout } from 'node:timers/promises'
import { test } from 'node:test'
import { getPayload } from 'payload'
import sharp from 'sharp'
import { sql } from '@payloadcms/db-postgres'
import { consumeContactRate } from '../../src/lib/contact-rate'
import { resetAdminPassword } from '../../scripts/reset-admin-password'
import { up as neutralBrandCopy } from '../../src/migrations/20261028_233812_neutral_brand_copy'
import config from '../../src/payload.config.js'
import type { Product } from '../../src/payload-types'

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
  const createdProducts: number[] = []
  const createdPosts: number[] = []
  const createdTeam: number[] = []
  const createdMedia: number[] = []
  let serverLog = ''
  t.after(async () => {
    if (server && server.exitCode === null) {
      server.kill()
      await Promise.race([once(server, 'exit'), setTimeout(10000, undefined, { ref: false })])
    }
    for (const id of createdPosts.reverse()) await payload.delete({ collection: 'posts', id, overrideAccess: true })
    for (const id of createdProducts.reverse()) await payload.delete({ collection: 'products', id, overrideAccess: true })
    for (const id of createdTeam.reverse()) await payload.delete({ collection: 'team', id, overrideAccess: true })
    for (const id of createdMedia.reverse()) await payload.delete({ collection: 'media', id, overrideAccess: true })
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
  const manager = await payload.create({
    collection: 'users', overrideAccess: true,
    data: { email: 'security-catalog@example.invalid', name: 'Test catalogue', role: 'catalog-manager', password },
  })
  createdIDs.push(manager.id)

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
      await payload.updateGlobal({ slug: 'site-settings', data: { tagline: 'Message de vérification CMS.' } })
      const response = await request(base)
      assert.equal(response.status, 200)
      assert.match(await response.text(), /Message de vérification CMS\./)
    } finally {
      await payload.updateGlobal({ slug: 'site-settings', data: { tagline: original.tagline } })
    }
  })

  const managerLogin = await post('/api/users/login', { email: manager.email, password })
  assert.equal(managerLogin.status, 200)
  const managerToken = (await managerLogin.json()).token as string
  const editorToken = (await (await post('/api/users/login', { email: editor.email, password })).json()).token as string
  const adminToken = (await (await post('/api/users/login', { email: admin.email, password })).json()).token as string
  const patch = (path: string, data: unknown, token: string) => request(`${base}${path}`, {
    method: 'PATCH', headers: { 'Content-Type': 'application/json', Authorization: `JWT ${token}` }, body: JSON.stringify(data),
  })
  const richText = (text: string): NonNullable<Product['description']> => ({ root: { type: 'root', version: 1, direction: null, format: '', indent: 0,
    children: [{ type: 'paragraph', version: 1, direction: null, format: '', indent: 0, textFormat: 0, textStyle: '',
      children: [{ type: 'text', version: 1, text, format: 0, detail: 0, mode: 'normal', style: '' }] }] } })

  async function upload(token: string, scope?: string) {
    const bytes = await sharp({ create: { width: 1200, height: 800, channels: 3, background: '#3D261C' } }).png().toBuffer()
    const form = new FormData()
    form.set('_payload', JSON.stringify({ alt: 'Image fictive de vérification', ...(scope ? { scope } : {}) }))
    form.set('file', new Blob([new Uint8Array(bytes)], { type: 'image/png' }), 'test-image.png')
    const response = await request(`${base}/api/media`, { method: 'POST', headers: { Authorization: `JWT ${token}` }, body: form })
    assert.equal(response.status, 201, await response.clone().text())
    const { doc } = await response.json()
    createdMedia.push(doc.id)
    return doc as { id: number; url: string; filename: string; scope: string; sizes: { thumbnail: { url: string } } }
  }
  const fileStatus = async (url: string) => request(`${base}${new URL(url, base).pathname}`)
  let productID: number
  const catalogPhoto = await upload(managerToken)
  const editorialPhoto = await upload(editorToken)

  await t.test('les uploads contrôlent les espaces, le format réel et les fichiers privés', async () => {
    assert.equal(catalogPhoto.scope, 'catalog')
    assert.equal(editorialPhoto.scope, 'editorial')
    assert.match(catalogPhoto.filename, /^[0-9a-f-]{36}\.png$/)
    assert.equal((await fileStatus(catalogPhoto.url)).status, 403)
    assert.equal((await fileStatus(catalogPhoto.sizes.thumbnail.url)).status, 403)
    assert.equal((await request(`${base}/api/media`)).status, 403)
    assert.equal((await patch(`/api/media/${editorialPhoto.id}`, { alt: 'Intrusion' }, managerToken)).status, 403)
    assert.equal((await patch(`/api/media/${catalogPhoto.id}`, { alt: 'Intrusion' }, editorToken)).status, 403)
    const form = new FormData()
    form.set('_payload', JSON.stringify({ alt: 'Fichier interdit' }))
    form.set('file', new Blob(['<svg onload="alert(1)"></svg>'], { type: 'image/svg+xml' }), 'unsafe.svg')
    assert.ok([400, 403].includes((await request(`${base}/api/media`, { method: 'POST', body: form,
      headers: { Authorization: `JWT ${managerToken}` } })).status))
    const spoofed = new FormData()
    spoofed.set('_payload', JSON.stringify({ alt: 'Fausse image' }))
    spoofed.set('file', new Blob(['not-an-image'], { type: 'image/png' }), 'fake.png')
    assert.ok((await request(`${base}/api/media`, { method: 'POST', body: spoofed,
      headers: { Authorization: `JWT ${managerToken}` } })).status >= 400)
  })

  await t.test('un gestionnaire crée un produit en brouillon sans droits administrateur', async () => {
    const response = await post('/api/products?draft=true', { name: 'Produit de test', slug: 'produit-de-test',
      gallery: [{ image: catalogPhoto.id }], _status: 'draft' }, managerToken)
    assert.equal(response.status, 201, await response.clone().text())
    const { doc } = await response.json()
    productID = doc.id
    createdProducts.push(productID)
    assert.equal((await (await request(`${base}/api/products`)).json()).totalDocs, 0)
    assert.equal((await request(`${base}/api/products/${productID}`)).status, 404)
    assert.equal((await request(`${base}/api/products?draft=true`)).status, 403)
    assert.equal((await post('/api/products', { name: 'Intrusion', slug: 'intrusion' }, editorToken)).status, 403)
    assert.equal((await post('/api/posts', { title: 'Intrusion', slug: 'intrusion' }, managerToken)).status, 403)
    assert.equal((await post('/api/team', { name: 'Intrusion' }, managerToken)).status, 403)
    assert.equal((await post('/api/globals/home', { hero: { title: 'Intrusion' } }, managerToken)).status, 403)
    const roleChange = await patch(`/api/users/${manager.id}`, { role: 'admin' }, managerToken)
    assert.ok([200, 403].includes(roleChange.status))
    assert.equal((await payload.findByID({ collection: 'users', id: manager.id })).role, 'catalog-manager')
  })

  await t.test('publication, galerie et prix facultatif fonctionnent sans exposer les brouillons', async () => {
    const invalid = await patch(`/api/products/${productID}`, { _status: 'published' }, managerToken)
    assert.equal(invalid.status, 400)
    const response = await patch(`/api/products/${productID}`, { _status: 'published', description: richText('Description de test'),
      allergenInformation: 'Informations fictives de test.', gallery: [{ image: catalogPhoto.id }] }, managerToken)
    assert.equal(response.status, 200, await response.clone().text())
    const published = await (await request(`${base}/api/products/${productID}?depth=1`)).json()
    assert.equal(published.name, 'Produit de test')
    assert.equal(published.price?.amount ?? null, null)
    assert.equal(published.gallery[0].image.id, catalogPhoto.id)
    const detailPage = await request(`${base}/produits/produit-de-test`)
    assert.equal(detailPage.status, 200)
    assert.match(await detailPage.text(), /Informations fictives de test/)
    assert.equal((await fileStatus(catalogPhoto.url)).status, 200)
    const thumbnail = await fileStatus(catalogPhoto.sizes.thumbnail.url)
    assert.equal(thumbnail.status, 200)
    assert.match(thumbnail.headers.get('cache-control') ?? '', /no-store/)
    const duplicate = await post('/api/products', { name: 'Doublon', slug: 'produit-de-test' }, managerToken)
    assert.equal(duplicate.status, 400)
    const unsafe = await patch(`/api/products/${productID}`, { cta: { label: 'Lien', href: 'javascript:alert(1)' } }, managerToken)
    assert.equal(unsafe.status, 400)
    const draft = await patch(`/api/products/${productID}?draft=true`, { name: 'Nom secret du brouillon', _status: 'draft' }, managerToken)
    assert.equal(draft.status, 200, await draft.clone().text())
    assert.equal((await (await request(`${base}/api/products/${productID}`)).json()).name, 'Produit de test')
    assert.equal((await request(`${base}/api/products/${productID}?draft=true`)).status, 403)
    assert.equal((await request(`${base}/api/products/versions`)).status, 403)
    assert.equal((await request(`${base}/api/products/versions`, { headers: { Authorization: `JWT ${managerToken}` } })).status, 200)
  })

  await t.test('archiver retire le produit et ses photos du public sans suppression définitive', async () => {
    assert.equal((await patch(`/api/products/${productID}`, { archived: true }, managerToken)).status, 200)
    assert.equal((await (await request(`${base}/api/products`)).json()).totalDocs, 0)
    assert.equal((await fileStatus(catalogPhoto.url)).status, 403)
    assert.equal((await request(`${base}/api/products/${productID}`, { method: 'DELETE', headers: { Authorization: `JWT ${managerToken}` } })).status, 403)
    assert.equal((await payload.findByID({ collection: 'products', id: productID })).archived, true)
    assert.equal((await request(`${base}/produits/produit-de-test`)).status, 404)
  })

  await t.test('actualités futures et membres brouillons sont exclus de la lecture publique', async () => {
    const article = await post('/api/posts', { title: 'Actualité de test', slug: 'actualite-de-test', _status: 'published',
      content: richText('Texte fictif'), cover: editorialPhoto.id, publishedAt: new Date(Date.now() + 86400000).toISOString() }, editorToken)
    assert.equal(article.status, 201, await article.clone().text())
    const articleID = (await article.json()).doc.id as number
    createdPosts.push(articleID)
    assert.equal((await (await request(`${base}/api/posts`)).json()).totalDocs, 0)
    assert.equal((await fileStatus(editorialPhoto.url)).status, 403)
    assert.equal((await patch(`/api/posts/${articleID}`, { publishedAt: new Date(Date.now() - 60000).toISOString() }, editorToken)).status, 200)
    assert.equal((await (await request(`${base}/api/posts`)).json()).totalDocs, 1)
    assert.equal((await fileStatus(editorialPhoto.url)).status, 200)
    const member = await post('/api/team?draft=true', { name: 'Membre fictif', _status: 'draft' }, editorToken)
    assert.equal(member.status, 201, await member.clone().text())
    const memberID = (await member.json()).doc.id as number
    createdTeam.push(memberID)
    assert.equal((await (await request(`${base}/api/team`)).json()).totalDocs, 0)
    assert.equal((await patch(`/api/team/${memberID}`, { _status: 'published' }, editorToken)).status, 200)
    assert.equal((await (await request(`${base}/api/team`)).json()).totalDocs, 1)
  })

  await t.test('les pages se publient dans le CMS et les textes légaux restent réservés aux admins', async () => {
    const initialHome = await payload.findGlobal({ slug: 'home', draft: false })
    try {
      const draft = await post('/api/globals/home?draft=true', { hero: { title: 'Titre de brouillon secret' }, _status: 'draft' }, editorToken)
      assert.equal(draft.status, 200, await draft.clone().text())
      assert.doesNotMatch(await (await request(`${base}/api/globals/home`)).text(), /Titre de brouillon secret/)
      assert.equal((await request(`${base}/api/globals/home?draft=true`)).status, 403)
      const published = await post('/api/globals/home', { hero: { title: 'Titre publié de vérification' }, _status: 'published' }, editorToken)
      assert.equal(published.status, 200, await published.clone().text())
      assert.equal((await (await request(`${base}/api/globals/home`)).json()).hero.title, 'Titre publié de vérification')
      assert.equal((await post('/api/globals/terms', { title: 'Intrusion' }, editorToken)).status, 403)
      assert.equal((await request(`${base}/api/globals/terms?draft=true`, { headers: { Authorization: `JWT ${editorToken}` } })).status, 403)
      assert.equal((await post('/api/globals/terms', { title: 'Texte juridique fictif', _status: 'draft' }, adminToken)).status, 200)
      const legal = await payload.findGlobal({ slug: 'terms', draft: true })
      assert.equal(legal.validationStatus, 'provisional')
    } finally {
      await payload.updateGlobal({ slug: 'home', user: { ...admin, collection: 'users' }, data: { ...initialHome, _status: initialHome._status || 'draft' } })
      await payload.updateGlobal({ slug: 'terms', user: { ...admin, collection: 'users' }, data: { title: null, content: null, _status: 'draft' } })
    }
  })

  await t.test('les pages publiques, les erreurs et les métadonnées répondent correctement', async () => {
    for (const path of ['/', '/produits', '/actualites', '/equipe', '/contact', '/cgv', '/mentions-legales']) {
      const response = await request(`${base}${path}`)
      assert.equal(response.status, 200, path)
      const html = await response.text()
      assert.match(html, /<html[^>]*lang="fr"/)
      assert.match(html, /noindex/)
    }
    assert.match(await (await request(`${base}/cgv`)).text(), /Texte provisoire/)
    assert.equal((await request(`${base}/produits/inconnu`)).status, 404)
    assert.equal((await request(`${base}/actualites/inconnu`)).status, 404)
    assert.equal((await request(`${base}/inconnue`)).status, 404)
    assert.match(await (await request(`${base}/robots.txt`)).text(), /Disallow: \//)
    assert.doesNotMatch(await (await request(`${base}/sitemap.xml`)).text(), /produit-de-test/)
  })

  await t.test('la limitation d’envoi est atomique et persiste dans PostgreSQL', async () => {
    const key = `test-${randomBytes(12).toString('hex')}`
    try {
      const results = await Promise.all(Array.from({ length: 12 }, () => consumeContactRate(payload.db.drizzle, key)))
      assert.equal(results.filter(Boolean).length, 5)
      assert.equal(await consumeContactRate(payload.db.drizzle, key), false)
      assert.equal(await consumeContactRate(payload.db.drizzle, key, Date.now() + 901000), true)
    } finally {
      await payload.db.drizzle.execute(sql`DELETE FROM payload_kv WHERE "key" IN (${`contact:${key}`}, 'contact:global')`)
    }
  })

  await t.test('la migration neutralise les textes et leurs versions sans changer les liens ou allergènes', async () => {
    const product = await payload.create({ collection: 'products', draft: true, data: {
      name: 'Bniouen au chocolat', slug: `bniouen-migration-${randomBytes(4).toString('hex')}`,
      summary: 'Pâtisserie artisanale algérienne.', description: richText('La pâtisserie algérienne et le bniouen.'),
      allergenInformation: 'Le bniouen contient des amandes.', cta: { label: 'Le bniouen', href: '/produits/bniouen-chocolat' },
    } })
    createdProducts.push(product.id)
    await neutralBrandCopy({ db: payload.db.drizzle } as Parameters<typeof neutralBrandCopy>[0])
    const updated = await payload.findByID({ collection: 'products', id: product.id })
    assert.equal(updated.name, 'Douceur au chocolat')
    assert.equal(updated.summary, 'Pâtisserie artisanale.')
    assert.deepEqual(updated.description, richText('La pâtisserie artisanale et la douceur.'))
    assert.equal(updated.allergenInformation, 'La douceur contient des amandes.')
    assert.equal(updated.cta?.label, 'La douceur')
    assert.equal(updated.cta?.href, product.cta?.href)
    assert.equal(updated.slug, product.slug)
    const versions = await payload.findVersions({ collection: 'products', where: { parent: { equals: product.id } } })
    assert.ok(versions.docs.length > 0)
    assert.ok(versions.docs.every((version) => version.version.name === updated.name))
    // Un second passage ne doit ni changer les nouveaux textes ni créer de versions.
    await neutralBrandCopy({ db: payload.db.drizzle } as Parameters<typeof neutralBrandCopy>[0])
    assert.equal((await payload.findByID({ collection: 'products', id: product.id })).name, updated.name)
  })

  await t.test('la récupération SSH refuse une confirmation incorrecte et récupère un admin verrouillé', async () => {
    const newPassword = randomBytes(24).toString('hex')
    await assert.rejects(() => resetAdminPassword(payload, admin.email, newPassword, `${newPassword}x`), /ne correspondent pas/)
    assert.equal((await post('/api/users/login', { email: admin.email, password })).status, 200)
    await assert.rejects(() => resetAdminPassword(payload, editor.email, newPassword, newPassword), /Aucun compte administrateur/)
    await payload.update({ collection: 'users', id: admin.id, data: { loginAttempts: 5, lockUntil: new Date(Date.now() + 600000).toISOString() } })
    assert.ok((await post('/api/users/login', { email: admin.email, password })).status >= 400)
    await resetAdminPassword(payload, admin.email.toUpperCase(), newPassword, newPassword)
    const account = await payload.findByID({ collection: 'users', id: admin.id, showHiddenFields: true })
    assert.equal(account.loginAttempts, 0)
    assert.equal(account.lockUntil, null)
    assert.deepEqual(account.sessions, [])
    assert.equal(account.resetPasswordToken, null)
    assert.equal((await post('/api/users/login', { email: admin.email, password: newPassword })).status, 200)
    assert.equal((await post('/api/users/login', { email: admin.email, password })).status, 401)
  })
})
