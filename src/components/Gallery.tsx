'use client'

import { useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import type { Media } from '@/payload-types'
import { Photo } from './Media'

export function Gallery({ images }: { images: Media[] }) {
  const [active, setActive] = useState(0)
  const reduced = useReducedMotion()
  if (!images.length) return null
  return <div className="gallery" role="region" aria-label="Photographies du produit">
    <AnimatePresence initial={false} mode="wait"><motion.div key={images[active].id} className="gallery-main" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: reduced ? 0 : 0.16 }}>
      <Photo value={images[active]} eager /></motion.div></AnimatePresence>
    {images.length > 1 && <div className="gallery-thumbnails">{images.map((image, i) => <button key={image.id} type="button" onClick={() => setActive(i)} aria-pressed={active === i} aria-label={`Afficher la photographie ${i + 1}`}>
      <Photo value={image} sizes="96px" /></button>)}</div>}
  </div>
}
