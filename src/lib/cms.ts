import 'server-only'
import { cache } from 'react'
import { getPayload, type GlobalSlug } from 'payload'
import config from '@payload-config'

export const cms = cache(() => getPayload({ config }))
export const identity = cache(async () => (await cms()).findGlobal({ slug: 'site-settings', depth: 1, overrideAccess: false }))
export const pageContent = cache(async <T extends GlobalSlug>(slug: T) =>
  (await cms()).findGlobal({ slug, depth: 1, draft: false, overrideAccess: false }))

export async function products(page = 1, featured = false) {
  return (await cms()).find({ collection: 'products', overrideAccess: false, draft: false, depth: 1,
    sort: ['order', 'id'], limit: featured ? 3 : 12, page,
    where: featured ? { featured: { equals: true } } : undefined })
}

export async function posts(page = 1, limit = 9) {
  return (await cms()).find({ collection: 'posts', overrideAccess: false, draft: false, depth: 1, sort: '-publishedAt', limit, page })
}

export async function team(featured = false) {
  return (await cms()).find({ collection: 'team', overrideAccess: false, draft: false, depth: 1,
    sort: ['order', 'id'], limit: featured ? 3 : 100, where: featured ? { featured: { equals: true } } : undefined })
}

export const productBySlug = cache(async (slug: string) =>
  (await (await cms()).find({ collection: 'products', where: { slug: { equals: slug } }, limit: 1, depth: 1, draft: false, overrideAccess: false })).docs[0])
export const postBySlug = cache(async (slug: string) =>
  (await (await cms()).find({ collection: 'posts', where: { slug: { equals: slug } }, limit: 1, depth: 1, draft: false, overrideAccess: false })).docs[0])

export function pageNumber(value: string | string[] | undefined) {
  const parsed = Number(typeof value === 'string' ? value : 1)
  return Number.isSafeInteger(parsed) && parsed > 0 && parsed <= 10000 ? parsed : 1
}
