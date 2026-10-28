import type { Media } from '@/payload-types'
import { mediaObject, mediaPath } from '@/lib/presentation'

export function Photo({ value, eager = false, sizes = '(max-width: 700px) 100vw, 50vw', className = '' }:
  { value?: Media | number | null; eager?: boolean; sizes?: string; className?: string }) {
  const image = mediaObject(value)
  const src = mediaPath(image?.url)
  if (!image || !src || !image.mimeType?.startsWith('image/')) return null
  const variants = [image.sizes?.thumbnail, image.sizes?.card, image.sizes?.large]
    .flatMap((size) => mediaPath(size?.url) && size?.width ? [`${mediaPath(size.url)} ${size.width}w`] : [])
  if (image.width) variants.push(`${src} ${image.width}w`)
  return <img className={className} src={src} srcSet={variants.join(', ') || undefined} sizes={sizes}
    alt={image.alt} width={image.width || 1200} height={image.height || 900} decoding="async"
    loading={eager ? 'eager' : 'lazy'} fetchPriority={eager ? 'high' : 'auto'}
    style={{ objectPosition: `${image.focalX ?? 50}% ${image.focalY ?? 50}%` }} />
}
