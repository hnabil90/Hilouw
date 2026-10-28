import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import '@fontsource-variable/cormorant-garamond'
import '@fontsource-variable/dm-sans'
import { identity } from '@/lib/cms'
import { serverURL } from '@/lib/environment'
import { Header } from '@/components/Header'
import { Footer } from '@/components/Footer'
import { mediaObject, mediaPath } from '@/lib/presentation'
import './styles.css'

export async function generateMetadata(): Promise<Metadata> {
  const site = await identity()
  return {
    metadataBase: new URL(serverURL()),
    icons: { icon: mediaPath(mediaObject(site.logo)?.url) || '/icon.svg' },
    title: { default: `${site.name} — ${site.subtitle}`, template: `%s — ${site.name}` },
    description: site.seo?.description || 'Douceurs et créations de pâtisserie artisanale.',
    robots: { index: process.env.SITE_INDEXABLE === 'true', follow: process.env.SITE_INDEXABLE === 'true' },
  }
}

export default async function Layout({ children }: { children: ReactNode }) {
  const site = await identity()
  return <html lang="fr" data-theme="hilouw"><body><a className="skip-link" href="#contenu">Aller au contenu</a>
    <Header name={site.name} subtitle={site.subtitle} logo={site.logo} links={site.navigation} /><main id="contenu">{children}</main><Footer site={site} /></body></html>
}
