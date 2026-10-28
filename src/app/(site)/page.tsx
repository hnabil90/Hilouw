import Link from 'next/link'
import { identity, pageContent, products, posts, team } from '@/lib/cms'
import { mediaObject } from '@/lib/presentation'
import { metadataFor } from '@/lib/seo'
import { Photo } from '@/components/Media'
import { RichText } from '@/components/RichText'
import { CTA } from '@/components/Shared'
import { ProductCard, PostCard, TeamMember } from '@/components/Cards'

export const dynamic = 'force-dynamic'
export async function generateMetadata() {
  const home = await pageContent('home')
  return metadataFor('Douceurs & Créations', '/', home.seo)
}

export default async function Home() {
  const [site, home, selection, journal, members] = await Promise.all([identity(), pageContent('home'), products(1, true), posts(1, 3), team(true)])
  const heroImage = mediaObject(home.hero?.image) || mediaObject(selection.docs[0]?.gallery?.[0]?.image)
  const single = selection.docs.length === 1 ? selection.docs[0] : undefined
  return <>
    <section className={`brand-hero ${heroImage ? 'hero-with-image' : 'hero-typographic'}`} aria-labelledby="hero-title">
      <div className="container hero-inner"><div className="hero-copy"><p className="section-label">Pâtisserie artisanale</p>
        <h1 id="hero-title">{home.hero?.title || site.tagline}</h1><p className="hero-description">{home.hero?.text || 'Un univers de douceurs, imaginé pour vos moments de partage.'}</p>
        <CTA value={home.hero?.cta} fallback={{ label: 'Découvrir nos douceurs', href: '/produits' }} /><Link className="hero-secondary" href="/equipe">L’histoire de HILOUW</Link></div>
        {heroImage ? <figure className="hero-photo"><Photo value={heroImage} eager sizes="(max-width: 760px) 100vw, 65vw" />{heroImage.caption && <figcaption>{heroImage.caption}</figcaption>}</figure> :
          <div className="brand-composition" aria-hidden="true"><div className="brand-orbit" /><span className="brand-initial">h.</span><span className="brand-signature">Douceurs & Créations</span></div>}
      </div><div className="container hero-footnote"><span>{site.name}</span><span>Le goût des choses faites avec soin.</span></div>
    </section>
    <section className="section introduction container"><p className="section-label">La maison HILOUW</p>
      {home.introduction ? <RichText value={home.introduction} className="intro-rich" /> : <h2>La pâtisserie artisanale,<br />une histoire de gourmandise.</h2>}
      <Link className="text-link" href="/equipe">Rencontrer notre équipe <span aria-hidden="true">↗</span></Link></section>
    {home.showProducts !== false && selection.docs.length > 0 && <section className="section selection-section"><div className="container">
      <div className="section-heading"><div><p className="section-label">À découvrir</p><h2>{home.productsTitle || 'Nos douceurs du moment'}</h2></div><Link className="text-link" href="/produits">Tout le catalogue <span aria-hidden="true">↗</span></Link></div>
      {single ? <article className="product-feature"><Link className="feature-image" href={`/produits/${single.slug}`}><Photo value={single.gallery?.[0]?.image} /></Link>
        <div className="feature-copy"><p className="section-label">Une création HILOUW</p><h3>{single.name}</h3><p>{single.summary}</p><CTA fallback={{ label: 'Découvrir cette création', href: `/produits/${single.slug}` }} /></div></article> :
        <div className="product-grid">{selection.docs.map((product) => <ProductCard key={product.id} product={product} />)}</div>}
    </div></section>}
    {home.craftsmanship?.title && <section className="section container craftsmanship">
      {mediaObject(home.craftsmanship.image) && <figure className="craft-image"><Photo value={home.craftsmanship.image} />{mediaObject(home.craftsmanship.image)?.caption && <figcaption>{mediaObject(home.craftsmanship.image)?.caption}</figcaption>}</figure>}
      <div><p className="section-label">Le geste et l’attention</p><h2>{home.craftsmanship.title}</h2><RichText value={home.craftsmanship.text} /></div></section>}
    {home.showPosts !== false && journal.docs.length > 0 && <section className="section container"><div className="section-heading"><div><p className="section-label">Les nouvelles de la maison</p><h2>{home.postsTitle || 'Le journal HILOUW'}</h2></div><Link className="text-link" href="/actualites">Toutes les actualités <span aria-hidden="true">↗</span></Link></div>
      <div className="post-grid">{journal.docs.map((post) => <PostCard key={post.id} post={post} />)}</div></section>}
    {home.showTeam !== false && members.docs.length > 0 && <section className="section team-preview"><div className="container"><div className="section-heading"><h2>{home.teamTitle || 'Derrière chaque douceur'}</h2><Link className="text-link" href="/equipe">Toute l’équipe <span aria-hidden="true">↗</span></Link></div>
      {members.docs.map((member) => <TeamMember key={member.id} member={member} />)}</div></section>}
    <section className="section contact-banner container"><p className="section-label">Un mot, une envie ?</p><h2>{home.contactText || 'Les belles histoires commencent par un échange.'}</h2><CTA value={home.contactCTA} fallback={{ label: 'Écrivez-nous', href: '/contact' }} /></section>
  </>
}
