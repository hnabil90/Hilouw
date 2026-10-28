'use client'

import { useState } from 'react'
import { videoEmbed } from '@/lib/presentation'

export function Video({ url, title }: { url: string; title: string }) {
  const [enabled, setEnabled] = useState(false)
  const embed = videoEmbed(url)
  if (!embed) return null
  return <div className="video-consent">{enabled ? <iframe src={embed} title={title} allow="fullscreen; picture-in-picture" allowFullScreen loading="lazy" referrerPolicy="no-referrer" /> :
    <div><p>Cette vidéo est hébergée sur un service externe.</p><p>En la chargeant, vous autorisez la connexion à YouTube ou Vimeo.</p><button className="btn btn-outline" type="button" onClick={() => setEnabled(true)}>Charger la vidéo</button></div>}</div>
}
