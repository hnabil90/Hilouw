import { notFound } from 'next/navigation'
import { pageNumber, products } from '@/lib/cms'
import { metadataFor } from '@/lib/seo'
import { ProductCard } from '@/components/Cards'
import { EmptyState, PageIntro, Pagination } from '@/components/Shared'

export const dynamic = 'force-dynamic'
export async function generateMetadata({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  const page = pageNumber((await searchParams).page)
  return metadataFor(page > 1 ? `Nos douceurs, page ${page}` : 'Nos douceurs', page > 1 ? `/produits?page=${page}` : '/produits')
}

export default async function ProductsPage({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  const page = pageNumber((await searchParams).page)
  const result = await products(page)
  if (page > Math.max(1, result.totalPages)) notFound()
  return <><PageIntro label="Le catalogue" title="Nos douceurs" text="Découvrez les créations de la maison, au fil de nos inspirations." />
    <section className="container section catalog-section">{result.docs.length ? <div className={`product-grid ${result.docs.length === 1 ? 'single-product-grid' : ''}`}>{result.docs.map((product) => <ProductCard key={product.id} product={product} />)}</div> :
      <EmptyState title="De nouvelles douceurs se préparent." text="Nos créations seront présentées ici prochainement. Pour une question ou une envie, écrivez-nous." />}
      <Pagination page={page} total={result.totalPages} path="/produits" /></section></>
}
