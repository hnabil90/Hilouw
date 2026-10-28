import Link from 'next/link'
import type { SiteSetting } from '@/payload-types'
import { validLink } from '@/fields/editorial'
import { mediaObject } from '@/lib/presentation'
import { Photo } from './Media'

export function Footer({ site }: { site: SiteSetting }) {
  return <footer className="site-footer"><div className="container footer-main">
    <div className="footer-brand"><Link href="/" className="footer-wordmark" aria-label={`${site.name}, accueil`}>{mediaObject(site.logo) ? <Photo value={site.logo} sizes="180px" className="footer-logo" /> : site.name}</Link><p>{site.tagline}</p><p>{site.footerText || site.subtitle}</p></div>
    <nav aria-label="Explorer"><p className="footer-heading">La maison</p><Link href="/produits">Nos douceurs</Link><Link href="/equipe">Notre équipe</Link><Link href="/actualites">Le journal</Link><Link href="/contact">Contact</Link></nav>
    <div><p className="footer-heading">Restons en lien</p>{site.contactEmail && <a href={`mailto:${site.contactEmail}`}>{site.contactEmail}</a>}
      {site.phone && <p>{site.phone}</p>}{site.address && <p className="preserve-lines">{site.address}</p>}
      {site.socialLinks?.map(({ link, id }) => link?.href && link.label && validLink(link.href) === true ? <a key={id || link.href} href={link.href} rel="noopener noreferrer">{link.label}</a> : null)}
      <Link href="/admin">Espace équipe</Link></div>
  </div><div className="container footer-bottom"><span>© {new Date().getUTCFullYear()} {site.name}</span><nav aria-label="Informations légales"><Link href="/cgv">CGV</Link><Link href="/mentions-legales">Mentions légales</Link></nav><span>Douceurs & Créations</span></div></footer>
}
