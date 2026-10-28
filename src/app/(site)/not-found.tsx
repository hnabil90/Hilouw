import Link from 'next/link'

export default function NotFound() {
  return <div className="container error-page"><p className="section-label">Page introuvable</p><h1>Cette douceur<br />nous échappe.</h1><p>La page demandée n’existe pas ou n’est plus disponible.</p><Link className="btn brand-button" href="/">Revenir à l’accueil</Link></div>
}
