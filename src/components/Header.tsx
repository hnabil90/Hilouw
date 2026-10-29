'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import type { SiteSetting } from '@/payload-types'
import { validLink } from '@/fields/editorial'
import { mediaObject } from '@/lib/presentation'
import { Photo } from './Media'

export function Header({ name, logo, links }: { name: string; logo?: SiteSetting['logo']; links: SiteSetting['navigation'] }) {
  const path = usePathname()
  const [open, setOpen] = useState(false)
  const trigger = useRef<HTMLButtonElement>(null)
  const panel = useRef<HTMLDivElement>(null)
  const items = links?.flatMap(({ link }) => link?.href && link.label && validLink(link.href) === true ? [{ href: link.href, label: link.label }] : [])
  const navigation = items?.length ? items : [
    { href: '/produits', label: 'Nos douceurs' }, { href: '/equipe', label: 'Notre histoire' }, { href: '/actualites', label: 'Le journal' },
  ]
  useEffect(() => { setOpen(false) }, [path])
  useEffect(() => {
    if (!open) return
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    panel.current?.querySelector<HTMLAnchorElement>('a')?.focus()
    const keydown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') { setOpen(false); trigger.current?.focus() }
      if (event.key === 'Tab') {
        const nodes = [trigger.current, ...Array.from(panel.current?.querySelectorAll<HTMLAnchorElement>('a') || [])].filter(Boolean) as HTMLElement[]
        const first = nodes[0], last = nodes[nodes.length - 1]
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus() }
        if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus() }
      }
    }
    window.addEventListener('keydown', keydown)
    return () => { document.body.style.overflow = previous; window.removeEventListener('keydown', keydown) }
  }, [open])
  return <header className="site-header"><div className="header-inner">
    <Link href="/" className="wordmark" aria-label={`${name}, accueil`}>{mediaObject(logo)
      ? <Photo value={logo} eager sizes="(max-width: 760px) 156px, 216px" className="brand-logo" />
      : <img src="/brand/hilouw-logo-transparent.png" className="brand-logo" alt={`${name} — Douceurs & Créations`} width={1880} height={836} decoding="async" fetchPriority="high" />}</Link>
    <nav className="desktop-nav" aria-label="Navigation principale">{navigation.map((item) => <Link key={item.href} href={item.href} aria-current={path === item.href ? 'page' : undefined}>{item.label}</Link>)}</nav>
    <Link href="/contact" className="btn contact-nav">Parlons douceurs</Link>
    <button ref={trigger} type="button" className="btn btn-ghost menu-toggle" aria-controls="mobile-navigation" aria-expanded={open}
      aria-label={open ? 'Fermer le menu' : 'Ouvrir le menu'} onClick={() => setOpen(!open)}>{open ? 'Fermer' : 'Menu'}<span aria-hidden="true">{open ? '×' : '☰'}</span></button>
    <div ref={panel} id="mobile-navigation" className="mobile-navigation" hidden={!open}>
      <nav aria-label="Navigation mobile">{navigation.map((item) => <Link key={item.href} href={item.href} onClick={() => setOpen(false)}>{item.label}</Link>)}
        <Link href="/contact" onClick={() => setOpen(false)}>Nous contacter</Link></nav>
    </div>
  </div></header>
}
