import { LegalPage } from '@/components/LegalPage'
import { pageContent } from '@/lib/cms'
import { metadataFor } from '@/lib/seo'

export const dynamic = 'force-dynamic'
export async function generateMetadata() { const page = await pageContent('terms'); return metadataFor('Conditions générales de vente', '/cgv', page.seo) }
export default function TermsPage() { return <LegalPage slug="terms" /> }
