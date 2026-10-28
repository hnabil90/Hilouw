import Link from 'next/link'
import type { Product, Post, Team } from '@/payload-types'
import { dateLabel, mediaObject, priceLabel } from '@/lib/presentation'
import { Photo } from './Media'
import { RichText } from './RichText'

export function ProductCard({ product }: { product: Product }) {
  const image = product.gallery?.find((row) => mediaObject(row.image))?.image
  return <article className="product-card"><Link href={`/produits/${product.slug}`} className="product-image" aria-label={`Découvrir ${product.name}`}>
    <Photo value={image} sizes="(max-width: 700px) 100vw, 33vw" /></Link>
    <div className="card-heading"><h2><Link href={`/produits/${product.slug}`}>{product.name}</Link></h2><span>{priceLabel(product.price?.amount, product.price?.currency)}</span></div>
    {product.summary && <p>{product.summary}</p>}<Link className="text-link" href={`/produits/${product.slug}`}>Découvrir cette douceur <span aria-hidden="true">↗</span></Link></article>
}

export function PostCard({ post }: { post: Post }) {
  return <article className="post-card"><Link className="post-image" href={`/actualites/${post.slug}`} tabIndex={-1} aria-hidden="true"><Photo value={post.cover} sizes="(max-width: 700px) 100vw, 33vw" /></Link>
    {post.publishedAt && <time dateTime={post.publishedAt}>{dateLabel(post.publishedAt)}</time>}<h2><Link href={`/actualites/${post.slug}`}>{post.title}</Link></h2>{post.excerpt && <p>{post.excerpt}</p>}
    <Link className="text-link" href={`/actualites/${post.slug}`}>Lire l’actualité <span aria-hidden="true">↗</span></Link></article>
}

export function TeamMember({ member }: { member: Team }) {
  return <article className={`team-member ${mediaObject(member.portrait) ? '' : 'without-portrait'}`}>{mediaObject(member.portrait) && <div className="portrait"><Photo value={member.portrait} sizes="(max-width: 700px) 100vw, 40vw" /></div>}
    <div><h2>{member.name}</h2>{member.position && <p className="member-position">{member.position}</p>}<RichText value={member.biography} /></div></article>
}
