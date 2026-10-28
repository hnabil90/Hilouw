import { notFound } from 'next/navigation'

export const metadata = { title: 'Page introuvable', robots: { index: false, follow: false } }
export default function MissingPage() { notFound() }
