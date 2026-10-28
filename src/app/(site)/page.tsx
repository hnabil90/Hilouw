import config from '@payload-config'
import { getPayload } from 'payload'

export const dynamic = 'force-dynamic'

export default async function Home() {
  const payload = await getPayload({ config })
  const site = await payload.findGlobal({ slug: 'site-settings', overrideAccess: false })
  return (
    <main className="holding-page">
      <h1>{site.name}</h1>
      <p className="subtitle">{site.subtitle}</p>
      <hr />
      <p className="tagline">{site.tagline}</p>
      <p>{site.holdingMessage}</p>
    </main>
  )
}
