import type { Media } from '@/payload-types'

export function textContent(value: unknown, depth = 0): string {
  if (!value || typeof value !== 'object' || depth > 32) return ''
  const node = value as { text?: string; root?: unknown; children?: unknown[] }
  if (typeof node.text === 'string') return node.text
  if (node.root) return textContent(node.root, depth + 1)
  return node.children?.map((child) => textContent(child, depth + 1)).join(' ') ?? ''
}

export function mediaObject(value: number | Media | null | undefined): Media | undefined {
  return value && typeof value === 'object' && value.url ? value : undefined
}

export function mediaPath(value: string | null | undefined): string | undefined {
  if (!value) return undefined
  try {
    const url = new URL(value, 'https://hilouw.com')
    return url.pathname.startsWith('/api/media/file/') ? url.pathname : undefined
  } catch { return undefined }
}

export function priceLabel(amount?: number | null, currency?: string | null): string | undefined {
  if (amount == null) return undefined
  try { return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: currency || 'EUR' }).format(amount / 100) }
  catch { return undefined }
}

export const dateLabel = (value: string) => new Intl.DateTimeFormat('fr-FR', { dateStyle: 'long', timeZone: 'Europe/Paris' }).format(new Date(value))

export function videoEmbed(value?: string | null): string | undefined {
  if (!value) return undefined
  try {
    const url = new URL(value)
    if (url.protocol !== 'https:') return undefined
    if (['youtube.com', 'www.youtube.com', 'youtu.be'].includes(url.hostname)) {
      const id = url.hostname === 'youtu.be' ? url.pathname.slice(1) : url.searchParams.get('v') || url.pathname.split('/').pop()
      if (id && /^[\w-]{11}$/.test(id)) return `https://www.youtube-nocookie.com/embed/${id}`
    }
    if (['vimeo.com', 'www.vimeo.com', 'player.vimeo.com'].includes(url.hostname)) {
      const id = url.pathname.split('/').pop()
      if (id && /^\d+$/.test(id)) return `https://player.vimeo.com/video/${id}?dnt=1`
    }
  } catch { /* Aucune intégration d’URL invalide. */ }
  return undefined
}
