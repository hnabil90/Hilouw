import 'dotenv/config'
import path from 'node:path'
import { randomBytes, randomUUID } from 'node:crypto'
import { readdir } from 'node:fs/promises'
import { getPayload } from 'payload'
import config from '../src/payload.config.js'

async function main() {
  const database = new URL(process.env.DATABASE_URL || '')
  if (!database.pathname.endsWith('_test') || process.env.SITE_INDEXABLE === 'true') {
    throw new Error('Import réservé à une base locale de prévisualisation dont le nom finit par _test, sans indexation.')
  }
  const payload = await getPayload({ config })
  const assets = [
    ['01_hero_sans_degrade.jpg', 'Douceur au chocolat dans un coffret clair.'],
    ['02_coffret_gourmand.jpg', 'Coffret de douceurs au chocolat.'],
    ['03_bniouen_texture_coupe.jpg', 'Une douceur coupée pour en montrer la texture.'],
    ['04_bniouen_coupe_detail.jpg', 'Détail de l’intérieur d’une douceur au chocolat.'],
    ['05_coffret_signature.jpg', 'Coffret de présentation de douceurs chocolatées.'],
    ['06_preparation_artisanale.jpg', 'Geste de finition sur une douceur au chocolat.'],
    ['07_coffret_cadeau.jpg', 'Coffret cadeau portant le nom HILOUW.'],
    ['08_macro_chocolat.jpg', 'Détail d’un enrobage au chocolat.'],
  ] as const
  const ids: number[] = []
  let temporaryUserID: number | undefined
  try {
    let actor = (await payload.find({ collection: 'users', where: { role: { equals: 'admin' } }, limit: 1 })).docs[0]
    if (!actor) {
      actor = await payload.create({ collection: 'users', data: { name: 'Prévisualisation locale',
        email: `preview-${randomUUID()}@example.invalid`, password: randomBytes(32).toString('hex'), role: 'admin' } })
      temporaryUserID = actor.id
    }
    const user = { ...actor, collection: 'users' as const }
    for (const [filename, alt] of assets) {
      const existing = await payload.find({ collection: 'media', where: { and: [{ alt: { equals: alt } }, { credit: { equals: 'Prévisualisation HILOUW' } }] }, limit: 1, depth: 0 })
      if (existing.docs[0]) { ids.push(existing.docs[0].id); continue }
      const media = await payload.create({ collection: 'media', overrideAccess: true, user,
        filePath: path.resolve('media', filename), data: { alt, scope: 'editorial', caption: 'Visuel d’ambiance temporaire', credit: 'Prévisualisation HILOUW' } })
      ids.push(media.id)
    }
    const home = await payload.findGlobal({ slug: 'home', draft: false })
    const site = await payload.findGlobal({ slug: 'site-settings' })
    const logoFile = (await readdir('media')).find((filename) => /logo/i.test(filename) && /\.(png|jpe?g|webp)$/i.test(filename))
    if (logoFile) {
      let logo = (await payload.find({ collection: 'media', where: { and: [{ alt: { equals: 'Logo HILOUW' } }, { credit: { equals: 'Identité HILOUW' } }] }, limit: 1 })).docs[0]
      if (!logo) logo = await payload.create({ collection: 'media', user, filePath: path.resolve('media', logoFile),
        data: { alt: 'Logo HILOUW', scope: 'editorial', credit: 'Identité HILOUW' } })
      await payload.updateGlobal({ slug: 'site-settings', user, data: { logo: logo.id } })
      console.log('Logo original chargé dans l’identité du site.')
    }
    await payload.updateGlobal({ slug: 'home', user, data: { _status: 'published',
      hero: { title: site.tagline, text: 'Un univers de douceurs, imaginé pour vos moments de partage.', image: ids[0] },
      craftsmanship: { title: 'Le soin du geste, la douceur du partage.', text: home.craftsmanship?.text, image: ids[5] },
    } })
    console.log(`${ids.length} visuels temporaires importés. Aucun produit ou prix n’a été créé.`)
  } finally {
    if (temporaryUserID) await payload.delete({ collection: 'users', id: temporaryUserID })
    await payload.destroy()
  }
}

try { await main(); process.exit(0) }
catch (error) { console.error(error instanceof Error ? error.message : 'Import impossible.'); process.exit(1) }
