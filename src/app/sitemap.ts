import type { MetadataRoute } from 'next'
import { cms, identity, pageContent } from '@/lib/cms'
import { serverURL } from '@/lib/environment'

export const dynamic = 'force-dynamic'
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  if (process.env.SITE_INDEXABLE !== 'true' || (await identity()).seo?.noIndex) return []
  const payload = await cms()
  const [products, posts, home, team, contact, terms, legal] = await Promise.all([
    payload.find({ collection: 'products', pagination: false, depth: 0, overrideAccess: false, draft: false }),
    payload.find({ collection: 'posts', pagination: false, depth: 0, overrideAccess: false, draft: false }),
    pageContent('home'), pageContent('team-page'), pageContent('contact-page'), pageContent('terms'), pageContent('legal-notice'),
  ])
  const base = serverURL()
  const pages = [['/', home], ['/equipe', team], ['/contact', contact], ['/cgv', terms], ['/mentions-legales', legal]] as const
  return [
    ...pages.flatMap(([path, page]) => page.seo?.noIndex || ('_status' in page && page._status !== 'published') ? [] : [{ url: `${base}${path}`, lastModified: page.updatedAt || undefined }]),
    { url: `${base}/produits` }, { url: `${base}/actualites` },
    ...products.docs.filter((doc) => !doc.seo?.noIndex).map((doc) => ({ url: `${base}/produits/${doc.slug}`, lastModified: doc.updatedAt })),
    ...posts.docs.filter((doc) => !doc.seo?.noIndex).map((doc) => ({ url: `${base}/actualites/${doc.slug}`, lastModified: doc.updatedAt })),
  ]
}
