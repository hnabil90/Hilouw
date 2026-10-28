import 'dotenv/config'
import { test, expect } from '@playwright/test'
import { getPayload, type Payload } from 'payload'
import sharp from 'sharp'
import { randomBytes, randomUUID } from 'node:crypto'
import config from '../../src/payload.config'

let payload: Payload
const mediaIDs: number[] = []
let productID: number
let userID: number
const richText = { root: { type: 'root', version: 1, direction: null, format: '' as const, indent: 0,
  children: [{ type: 'paragraph', version: 1, direction: null, format: '', indent: 0,
    children: [{ type: 'text', version: 1, text: 'Une description uniquement destinée aux tests navigateur.', format: 0, detail: 0, mode: 'normal', style: '' }] }] } }

test.beforeAll(async () => {
  if (!new URL(process.env.DATABASE_URL || '').pathname.endsWith('_test')) throw new Error('Base de test requise.')
  payload = await getPayload({ config })
  const actor = await payload.create({ collection: 'users', data: { email: `browser-${randomUUID()}@example.invalid`,
    name: 'Test navigateur', password: randomBytes(32).toString('hex'), role: 'admin' } })
  userID = actor.id
  const user = { ...actor, collection: 'users' as const }
  for (const background of ['#3D261C', '#B89A65']) {
    const bytes = await sharp({ create: { width: 1200, height: 1000, channels: 3, background } }).png().toBuffer()
    const media = await payload.create({ collection: 'media', user, data: { alt: 'Image fictive du test navigateur', scope: 'catalog' },
      file: { data: bytes, name: 'test.png', mimetype: 'image/png', size: bytes.length } })
    mediaIDs.push(media.id)
  }
  const product = await payload.create({ collection: 'products', user, data: { name: 'Création de test navigateur', slug: 'creation-test-navigateur',
    _status: 'published', order: 0, description: richText, allergenInformation: 'Allergènes fictifs du test navigateur.',
    gallery: mediaIDs.map((image) => ({ image })), price: { amount: 1250, currency: 'EUR' } } })
  productID = product.id
})

test.afterAll(async () => {
  if (!payload) return
  if (productID) await payload.delete({ collection: 'products', id: productID })
  for (const id of mediaIDs) await payload.delete({ collection: 'media', id })
  if (userID) await payload.delete({ collection: 'users', id: userID })
  await payload.destroy()
  // Le pool Payload retient un client de reconnexion ; Playwright ferme son worker.
})

test('le site est utilisable sur mobile, tablette et ordinateur sans débordement', async ({ page }) => {
  const errors: string[] = []
  page.on('pageerror', (error) => errors.push(error.message))
  for (const width of [375, 768, 1440]) {
    await page.setViewportSize({ width, height: 950 })
    for (const path of ['/', '/produits', '/equipe', '/actualites', '/contact', '/cgv', '/mentions-legales']) {
      await page.goto(path)
      await expect(page.locator('h1')).toHaveCount(1)
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1)
      expect(overflow, `${path} à ${width}px`).toBe(false)
    }
  }
  expect(errors).toEqual([])
})

test('le menu mobile s’ouvre au clavier, piège le focus et se ferme avec Échap', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 })
  await page.goto('/')
  const button = page.getByRole('button', { name: 'Ouvrir le menu' })
  await button.focus()
  await page.keyboard.press('Enter')
  await expect(page.getByRole('button', { name: 'Fermer le menu' })).toHaveAttribute('aria-expanded', 'true')
  await expect(page.getByRole('navigation', { name: 'Navigation mobile' }).getByRole('link').first()).toBeFocused()
  await page.keyboard.press('Escape')
  await expect(page.getByRole('button', { name: 'Ouvrir le menu' })).toBeFocused()
  await expect(page.getByRole('navigation', { name: 'Navigation mobile' })).not.toBeVisible()
})

test('une création publiée possède sa galerie, son prix et ses allergènes', async ({ page }) => {
  await page.goto('/produits/creation-test-navigateur')
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Création de test navigateur')
  await expect(page.locator('.product-price')).toContainText('12,50')
  await expect(page.getByText('Allergènes fictifs du test navigateur.')).toBeVisible()
  await page.getByRole('button', { name: 'Afficher la photographie 2' }).click()
  await expect(page.getByRole('button', { name: 'Afficher la photographie 2' })).toHaveAttribute('aria-pressed', 'true')
  await expect(page.locator('.gallery-main img')).toBeVisible()
  await page.getByRole('link', { name: 'Nous contacter à propos de cette création' }).click()
  await expect(page.getByLabel('Le sujet')).toHaveValue('À propos de Création de test navigateur')
})

test('le formulaire valide, garde le message en cas d’erreur et confirme après réussite', async ({ page }) => {
  await page.goto('/contact')
  await page.getByRole('button', { name: 'Envoyer mon message' }).click()
  await expect(page.getByText('Indiquez votre nom.')).toBeVisible()
  await page.getByLabel('Votre nom').fill('Test navigateur')
  await page.getByLabel('Votre email').fill('test@example.invalid')
  await page.getByLabel('Le sujet').fill('Question de test')
  await page.getByLabel('Votre message', { exact: false }).fill('Ceci est un message de vérification navigateur.')
  await page.getByRole('checkbox').check()
  await page.route('**/api/contact', (route) => route.fulfill({ status: 502, contentType: 'application/json', body: JSON.stringify({ error: 'Échec de test, réessayez.' }) }))
  await page.getByRole('button', { name: 'Envoyer mon message' }).click()
  await expect(page.getByRole('status')).toContainText('Échec de test')
  await expect(page.getByLabel('Votre message', { exact: false })).toHaveValue('Ceci est un message de vérification navigateur.')
  await page.unroute('**/api/contact')
  await page.route('**/api/contact', (route) => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ message: 'Votre message a été transmis.' }) }))
  await page.getByRole('button', { name: 'Envoyer mon message' }).click()
  await expect(page.getByRole('heading', { name: 'Merci pour votre message.' })).toBeVisible()
})

test('les liens d’évitement et la préférence de mouvement réduit sont respectés', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/')
  await page.keyboard.press('Tab')
  await expect(page.getByRole('link', { name: 'Aller au contenu' })).toBeFocused()
  const duration = await page.locator('.hero-copy').evaluate((element) => getComputedStyle(element).animationDuration)
  expect(parseFloat(duration)).toBeLessThan(0.01)
})
