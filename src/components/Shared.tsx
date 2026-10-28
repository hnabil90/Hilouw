import Link from 'next/link'
import { validLink } from '@/fields/editorial'

export function CTA({ value, fallback, className = '' }: { value?: { label?: string | null; href?: string | null } | null;
  fallback?: { label: string; href: string }; className?: string }) {
  const button = value?.href && value.label && validLink(value.href) === true ? value as { label: string; href: string } : fallback
  return button ? <Link className={`btn brand-button ${className}`} href={button.href}>{button.label}<span aria-hidden="true">↗</span></Link> : null
}

export function PageIntro({ title, text, label }: { title: string; text?: string | null; label?: string }) {
  return <div className="container page-intro">{label && <p className="section-label">{label}</p>}<h1>{title}</h1>{text && <p className="intro-copy">{text}</p>}</div>
}

export function EmptyState({ title, text }: { title: string; text: string }) {
  return <div className="empty-state"><span className="empty-mark" aria-hidden="true">h.</span><h2>{title}</h2><p>{text}</p><Link className="text-link" href="/contact">Échangeons ensemble <span aria-hidden="true">↗</span></Link></div>
}

export function Pagination({ page, total, path }: { page: number; total: number; path: string }) {
  if (total < 2) return null
  return <nav className="pagination" aria-label="Pagination">{page > 1 ? <Link className="btn btn-outline" href={`${path}?page=${page - 1}`}>Page précédente</Link> : <span />}
    <span>Page {page} sur {total}</span>{page < total ? <Link className="btn btn-outline" href={`${path}?page=${page + 1}`}>Page suivante</Link> : <span />}</nav>
}
