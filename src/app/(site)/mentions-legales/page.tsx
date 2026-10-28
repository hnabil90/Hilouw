import { LegalPage } from '@/components/LegalPage'
import { pageContent } from '@/lib/cms'
import { metadataFor } from '@/lib/seo'

export const dynamic = 'force-dynamic'
export async function generateMetadata() { const page = await pageContent('legal-notice'); return metadataFor('Mentions légales', '/mentions-legales', page.seo) }
export default function LegalNoticePage() { return <LegalPage slug="legal-notice" /> }
