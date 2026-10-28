import type { PayloadRequest } from 'payload'

export function exposePublicMedia(publishedOnly = true) {
  return ({ doc, req, overrideAccess }: { doc: Record<string, unknown>; req: PayloadRequest; overrideAccess?: boolean }) => {
    if (overrideAccess || (publishedOnly && doc._status !== 'published') || doc.archived === true
      || typeof doc.publishedAt === 'string' && new Date(doc.publishedAt).getTime() > Date.now()) return doc
    const ids = new Set<number>((req.context.publicMediaIDs as number[] | undefined) ?? [])
    const add = (value: unknown) => {
      const id = typeof value === 'number' ? value : value && typeof value === 'object' ? (value as { id?: unknown }).id : undefined
      if (typeof id === 'number') ids.add(id)
    }
    for (const key of ['cover', 'portrait', 'logo']) add(doc[key])
    for (const key of ['seo', 'hero', 'craftsmanship']) {
      const group = doc[key]
      if (group && typeof group === 'object') add((group as { image?: unknown }).image)
    }
    if (Array.isArray(doc.gallery)) for (const row of doc.gallery) { add(row.image); add(row.asset) }
    req.context.publicMediaIDs = [...ids]
    return doc
  }
}
