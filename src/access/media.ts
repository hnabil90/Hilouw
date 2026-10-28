import type { Access, Where } from 'payload'
import { canEditContent, canManageCatalog, isStaff, publishedWhere } from './content.js'

export const editMedia: Access = ({ req }) => {
  if (req.user?.role === 'admin') return true
  if (canManageCatalog(req.user)) return { scope: { equals: 'catalog' } }
  if (canEditContent(req.user)) return { scope: { equals: 'editorial' } }
  return false
}

const globalMediaFields = {
  home: ['hero.image', 'craftsmanship.image', 'seo.image'],
  'team-page': ['image', 'seo.image'],
  'contact-page': ['seo.image'],
  terms: ['seo.image'],
  'legal-notice': ['seo.image'],
} as const

const nested = (object: unknown, path: string): unknown => path.split('.').reduce<unknown>((value, key) =>
  value && typeof value === 'object' ? (value as Record<string, unknown>)[key] : undefined, object)

// Les fichiers sont privés par défaut ; seule une référence publiée les rend publics.
// Pas d’inventaire public de la médiathèque : les pages utilisent les relations ou l’URL du fichier.
export const readMedia: Access = async ({ id, data, req }) => {
  if (isStaff(req.user)) return true
  let mediaID = id == null ? undefined : Number(id)
  if (mediaID == null && typeof data?.filename === 'string') {
    const result = await req.payload.find({
      collection: 'media', depth: 0, limit: 1, overrideAccess: true, req,
      where: { or: ['filename', 'sizes.thumbnail.filename', 'sizes.card.filename', 'sizes.large.filename']
        .map((field) => ({ [field]: { equals: data.filename } })) },
    })
    mediaID = result.docs[0]?.id
  }
  if (!mediaID) {
    // Le dataloader Payload peuple les relations par lots sans transmettre d’id.
    // Seuls les ids ajoutés par le hook d’un parent publié sont autorisés.
    const ids = req.context.publicMediaIDs as number[] | undefined
    return ids?.length ? { id: { in: ids } } : false
  }
  if (!Number.isSafeInteger(mediaID)) return false

  const references: { collection: 'products' | 'posts' | 'team'; fields: string[] }[] = [
    { collection: 'products', fields: ['gallery.image', 'seo.image'] },
    { collection: 'posts', fields: ['cover', 'gallery.asset', 'seo.image'] },
    { collection: 'team', fields: ['portrait', 'seo.image'] },
  ]
  for (const { collection, fields } of references) {
    const result = await req.payload.find({
      collection, depth: 0, limit: 1, overrideAccess: true, draft: false, req, select: { updatedAt: true },
      where: { and: [publishedWhere(collection), { or: fields.map((field): Where => ({ [field]: { equals: mediaID } })) }] },
    })
    if (result.docs.length) return true
  }
  const identity = await req.payload.findGlobal({ slug: 'site-settings', depth: 0, overrideAccess: true, req })
  if (identity.logo === mediaID || identity.seo?.image === mediaID) return true
  for (const [slug, fields] of Object.entries(globalMediaFields)) {
    const value = await req.payload.findGlobal({ slug: slug as keyof typeof globalMediaFields, depth: 0, draft: false, overrideAccess: true, req })
    if (value._status === 'published' && fields.some((field) => nested(value, field) === mediaID)) return true
  }
  return false
}
