'use client'

import Link from 'next/link'

export default function ErrorPage({ reset }: { reset: () => void }) {
  return <div className="container error-page"><h1>Un petit contretemps.</h1><p>La page n’a pas pu être chargée. Vous pouvez réessayer dans quelques instants.</p>
    <button className="btn brand-button" onClick={reset}>Réessayer</button><Link className="text-link" href="/">Revenir à l’accueil</Link></div>
}
