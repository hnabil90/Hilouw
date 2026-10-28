import type { MetadataRoute } from 'next'
import { serverURL } from '@/lib/environment'

export const dynamic = 'force-dynamic'
export default function robots(): MetadataRoute.Robots {
  return process.env.SITE_INDEXABLE === 'true'
    ? { rules: { userAgent: '*', allow: '/', disallow: ['/admin', '/api/'] }, sitemap: `${serverURL()}/sitemap.xml` }
    : { rules: { userAgent: '*', disallow: '/' } }
}
