import Link from 'next/link'
import { notFound } from 'next/navigation'
import { productBySlug } from '@/lib/cms'
import { metadataFor } from '@/lib/seo'
import { mediaObject, mediaPath, priceLabel, textContent } from '@/lib/presentation'
import { serverURL } from '@/lib/environment'
import { Gallery } from '@/components/Gallery'
import { RichText } from '@/components/RichText'
import { CTA } from '@/components/Shared'

export const dynamic = 'force-dynamic'
type Props = { params: Promise<{ slug: string }> }
export async function generateMetadata({ params }: Props) {
  const product = await productBySlug((await params).slug)
  if (!product) notFound()
  return metadataFor(product.name, `/produits/${product.slug}`, product.seo, product.summary || textContent(product.description).slice(0, 170), product.gallery?.[0]?.image)
}

export default async function ProductPage({ params }: Props) {
  const product = await productBySlug((await params).slug)
  if (!product) notFound()
  const images = product.gallery?.flatMap((row) => { const image = mediaObject(row.image); return image ? [image] : [] }) || []
  const price = priceLabel(product.price?.amount, product.price?.currency)
  const structured = { '@context': 'https://schema.org', '@type': 'Product', name: product.name,
    description: product.summary || textContent(product.description), url: `${serverURL()}/produits/${product.slug}`,
    image: images.flatMap((image) => { const path = mediaPath(image.url); return path ? [new URL(path, serverURL()).href] : [] }),
    ...(price && product.price?.amount != null ? { offers: { '@type': 'Offer', price: (product.price.amount / 100).toFixed(2), priceCurrency: product.price.currency || 'EUR', url: `${serverURL()}/produits/${product.slug}` } } : {}) }
  return <><div className="container breadcrumb"><Link href="/produits">Nos douceurs</Link><span aria-hidden="true">/</span><span>{product.name}</span></div>
    <section className="container product-detail"><Gallery images={images} /><div className="product-information"><p className="section-label">Une création HILOUW</p><h1>{product.name}</h1>
      {price && <p className="product-price">{price}</p>}{product.summary && <p className="lead">{product.summary}</p>}<RichText value={product.description} />
      <CTA value={product.cta} fallback={{ label: 'Nous contacter à propos de cette création', href: `/contact?produit=${encodeURIComponent(product.name)}` }} />
      {product.allergenInformation && <details className="information-details" open><summary>Allergènes</summary><p className="preserve-lines">{product.allergenInformation}</p></details>}
      {product.usefulInformation && <details className="information-details"><summary>Conservation et informations utiles</summary><RichText value={product.usefulInformation} /></details>}</div></section>
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structured).replace(/</g, '\\u003c') }} /></>
}
