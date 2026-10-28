import { notFound } from 'next/navigation'
import { pageNumber, posts } from '@/lib/cms'
import { metadataFor } from '@/lib/seo'
import { PostCard } from '@/components/Cards'
import { EmptyState, PageIntro, Pagination } from '@/components/Shared'

export const dynamic = 'force-dynamic'
export async function generateMetadata({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  const page = pageNumber((await searchParams).page)
  return metadataFor(page > 1 ? `Le journal, page ${page}` : 'Le journal', page > 1 ? `/actualites?page=${page}` : '/actualites')
}
export default async function PostsPage({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  const page = pageNumber((await searchParams).page)
  const result = await posts(page)
  if (page > Math.max(1, result.totalPages)) notFound()
  return <><PageIntro label="Les nouvelles de la maison" title="Le journal HILOUW" text="Créations, inspirations et moments à partager." /><section className="section container catalog-section">
    {result.docs.length ? <div className="post-grid">{result.docs.map((post) => <PostCard key={post.id} post={post} />)}</div> : <EmptyState title="Le journal s’écrira bientôt." text="Retrouvez ici les prochaines nouvelles de HILOUW." />}
    <Pagination page={page} total={result.totalPages} path="/actualites" /></section></>
}
