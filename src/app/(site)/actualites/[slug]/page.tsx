import Link from 'next/link'
import { notFound } from 'next/navigation'
import { postBySlug } from '@/lib/cms'
import { metadataFor } from '@/lib/seo'
import { dateLabel, mediaObject, mediaPath, textContent } from '@/lib/presentation'
import { Photo } from '@/components/Media'
import { RichText } from '@/components/RichText'
import { Video } from '@/components/Video'

export const dynamic = 'force-dynamic'
type Props = { params: Promise<{ slug: string }> }
export async function generateMetadata({ params }: Props) {
  const post = await postBySlug((await params).slug)
  if (!post) notFound()
  const metadata = await metadataFor(post.title, `/actualites/${post.slug}`, post.seo, post.excerpt || textContent(post.content).slice(0, 170), post.cover)
  return { ...metadata, openGraph: { ...metadata.openGraph, type: 'article' as const, publishedTime: post.publishedAt || undefined } }
}

export default async function PostPage({ params }: Props) {
  const post = await postBySlug((await params).slug)
  if (!post) notFound()
  return <article className="article-page"><div className="container breadcrumb"><Link href="/actualites">Le journal</Link><span aria-hidden="true">/</span><span>{post.title}</span></div>
    <header className="article-header container">{post.publishedAt && <time dateTime={post.publishedAt}>{dateLabel(post.publishedAt)}</time>}<h1>{post.title}</h1>
      {post.excerpt && <p className="lead">{post.excerpt}</p>}{post.author && typeof post.author === 'object' && <p>Par {post.author.name}</p>}</header>
    {mediaObject(post.cover) && <div className="container article-cover"><Photo value={post.cover} eager sizes="(max-width: 1200px) 100vw, 1200px" /></div>}
    <div className="reading-width section"><RichText value={post.content} />
      {post.gallery?.map((row) => { const media = mediaObject(row.asset); return media ? <figure key={row.id || media.id} className="article-media">
        {media.mimeType?.startsWith('video/') ? <video controls preload="metadata" src={mediaPath(media.url)} aria-label={media.alt} /> : <Photo value={media} sizes="(max-width: 800px) 100vw, 760px" />}
        {row.caption && <figcaption>{row.caption}</figcaption>}</figure> : null })}
      {post.embedURL && <Video url={post.embedURL} title={`Vidéo : ${post.title}`} />}<Link className="text-link article-back" href="/actualites">Retour au journal</Link></div></article>
}
