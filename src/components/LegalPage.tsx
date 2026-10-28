import { pageContent } from '@/lib/cms'
import { dateLabel } from '@/lib/presentation'
import { PageIntro } from './Shared'
import { Contents, RichText } from './RichText'

export async function LegalPage({ slug }: { slug: 'terms' | 'legal-notice' }) {
  const page = await pageContent(slug)
  const title = page.title || (slug === 'terms' ? 'Conditions générales de vente' : 'Mentions légales')
  const provisional = page.validationStatus !== 'validated'
  return <><PageIntro label="Informations" title={title} /><div className="legal-layout container section">
    <Contents value={page.content} /><div className="legal-body">
      {provisional && <aside className="provisional-notice" role="note"><strong>Texte provisoire</strong><p>Ces informations sont en cours de rédaction et n’ont pas encore été validées par le propriétaire.</p></aside>}
      {page.lastReviewedAt && <p className="legal-date">Dernière vérification : {dateLabel(page.lastReviewedAt)}</p>}
      {'publisher' in page && page.publisher && <section><h2>Éditeur du site</h2><p className="preserve-lines">{page.publisher}</p></section>}
      {'hosting' in page && page.hosting && <section><h2>Hébergement</h2><p className="preserve-lines">{page.hosting}</p></section>}
      {'contactDetails' in page && page.contactDetails && <section><h2>Coordonnées</h2><p className="preserve-lines">{page.contactDetails}</p></section>}
      {page.content ? <RichText value={page.content} /> : <p>Les informations de cette page seront complétées avant l’ouverture du site.</p>}
    </div></div></>
}
