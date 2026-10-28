import { identity, pageContent } from '@/lib/cms'
import { metadataFor } from '@/lib/seo'
import { contactAvailable } from '@/lib/contact-server'
import { PageIntro } from '@/components/Shared'
import { ContactForm } from '@/components/ContactForm'
import { RichText } from '@/components/RichText'

export const dynamic = 'force-dynamic'
export async function generateMetadata() { const page = await pageContent('contact-page'); return metadataFor('Contact', '/contact', page.seo) }
export default async function ContactPage({ searchParams }: { searchParams: Promise<{ produit?: string }> }) {
  const [site, page, params] = await Promise.all([identity(), pageContent('contact-page'), searchParams])
  const product = typeof params.produit === 'string' ? params.produit.slice(0, 120) : undefined
  return <><PageIntro label="Restons en lien" title={page.title || 'Parlons douceurs.'} text="Une question, une envie particulière, un projet à partager ? Nous sommes à votre écoute." />
    <section className="container contact-layout section"><aside className="contact-aside"><h2>Un échange, tout simplement.</h2><RichText value={page.introduction} />
      {site.contactEmail && <div className="contact-detail"><h3>Par email</h3><a href={`mailto:${site.contactEmail}`}>{site.contactEmail}</a></div>}
      {site.phone && <div className="contact-detail"><h3>Par téléphone</h3><p>{site.phone}</p></div>}
      {site.address && <div className="contact-detail"><h3>Nous retrouver</h3><p className="preserve-lines">{site.address}</p></div>}
      {page.privacyInformation && <details className="information-details"><summary>Vos données personnelles</summary><RichText value={page.privacyInformation} /></details>}</aside>
      <ContactForm available={contactAvailable()} subjects={page.subjects?.map((subject) => subject.label) || []} consentLabel={page.consentLabel} initialProduct={product} /></section></>
}
