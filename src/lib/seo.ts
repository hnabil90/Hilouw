import 'server-only'
import type { Metadata } from 'next'
import type { Media } from '@/payload-types'
import { identity } from './cms'
import { mediaObject, mediaPath } from './presentation'
import { serverURL } from './environment'

type SEO = { title?: string | null; description?: string | null; image?: number | Media | null; noIndex?: boolean | null } | null

export async function metadataFor(title: string, path: string, seo?: SEO, description?: string, image?: number | Media | null): Promise<Metadata> {
  const site = await identity()
  const resolvedTitle = seo?.title || title
  const resolvedDescription = seo?.description || description || site.seo?.description || 'Douceurs et créations artisanales de pâtisserie algérienne.'
  const picture = mediaObject(seo?.image || image || site.seo?.image)
  const picturePath = mediaPath(picture?.url)
  const index = process.env.SITE_INDEXABLE === 'true' && !seo?.noIndex && !site.seo?.noIndex
  return {
    title: resolvedTitle,
    description: resolvedDescription,
    alternates: { canonical: path },
    robots: { index, follow: index },
    openGraph: { title: `${resolvedTitle} — ${site.name}`, description: resolvedDescription, locale: 'fr_FR', type: 'website',
      url: path, siteName: site.name, images: picturePath ? [{ url: new URL(picturePath, serverURL()).href, alt: picture?.alt }] : [] },
    twitter: { card: picturePath ? 'summary_large_image' : 'summary', title: resolvedTitle, description: resolvedDescription,
      images: picturePath ? [new URL(picturePath, serverURL()).href] : [] },
  }
}
