import { pageContent, team } from '@/lib/cms'
import { metadataFor } from '@/lib/seo'
import { mediaObject } from '@/lib/presentation'
import { PageIntro, EmptyState } from '@/components/Shared'
import { TeamMember } from '@/components/Cards'
import { RichText } from '@/components/RichText'
import { Photo } from '@/components/Media'

export const dynamic = 'force-dynamic'
export async function generateMetadata() { const page = await pageContent('team-page'); return metadataFor('Notre équipe', '/equipe', page.seo) }
export default async function TeamPage() {
  const [page, members] = await Promise.all([pageContent('team-page'), team()])
  return <><PageIntro label="La maison HILOUW" title={page.title || 'Une histoire de douceur'} />
    {(page.introduction || mediaObject(page.image)) && <section className="container story-intro">{mediaObject(page.image) && <div className="story-image"><Photo value={page.image} eager /></div>}<RichText value={page.introduction} /></section>}
    {page.history && <section className="reading-width section"><h2>Notre histoire</h2><RichText value={page.history} /></section>}
    {page.values && <section className="values-section section"><div className="reading-width"><h2>Ce qui nous anime</h2><RichText value={page.values} /></div></section>}
    <section className="container section">{members.docs.length ? <div className="team-list">{members.docs.map((member) => <TeamMember key={member.id} member={member} />)}</div> :
      <EmptyState title="Faisons bientôt connaissance." text="L’histoire et les visages de HILOUW seront présentés ici prochainement." />}</section></>
}
