import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import './styles.css'

export const metadata: Metadata = {
  title: 'HILOUW — Douceurs & Créations',
  description: 'HILOUW, douceurs et créations artisanales de pâtisserie algérienne.',
  robots: { index: false, follow: false },
}

export default function Layout({ children }: { children: ReactNode }) {
  return <html lang="fr" data-theme="hilouw"><body>{children}</body></html>
}
