import type { Field } from 'payload'

export const imageMimeTypes = ['image/jpeg', 'image/png', 'image/webp']

export function validLink(value: unknown): true | string {
  if (value == null || value === '') return true
  if (typeof value !== 'string' || /[\u0000-\u0020\\]/.test(value)) return 'Utiliser une adresse HTTPS ou un chemin interne.'
  if (value.startsWith('/') && !value.startsWith('//')) return true
  try {
    const url = new URL(value)
    if (url.protocol === 'https:' && !url.username && !url.password) return true
  } catch { /* Validation ci-dessous. */ }
  return 'Utiliser une adresse HTTPS ou un chemin interne.'
}

export const image = (name: string, label: string): Field => ({
  name, label, type: 'upload', relationTo: 'media',
  filterOptions: { mimeType: { in: imageMimeTypes } },
})

export const seo: Field = {
  name: 'seo', label: 'Référencement', type: 'group',
  fields: [
    { name: 'title', label: 'Titre SEO', type: 'text', maxLength: 80 },
    { name: 'description', label: 'Description SEO', type: 'textarea', maxLength: 180 },
    image('image', 'Image de partage'),
    { name: 'noIndex', label: 'Exclure cette page des moteurs de recherche', type: 'checkbox', defaultValue: false },
  ],
}

export const cta = (name = 'cta', label = 'Bouton'): Field => ({
  name, label, type: 'group',
  fields: [
    { name: 'label', label: 'Libellé', type: 'text', maxLength: 80 },
    { name: 'href', label: 'Destination', type: 'text', validate: validLink,
      admin: { description: 'Chemin interne (ex. /contact) ou adresse https://…' } },
  ],
  validate: (value: unknown) => {
    const button = value as { label?: string; href?: string } | undefined
    return Boolean(button?.label) === Boolean(button?.href) || 'Renseigner à la fois le libellé et la destination.'
  },
})

export const slug: Field = {
  name: 'slug', label: 'Adresse de la page', type: 'text', required: true, unique: true, index: true,
  admin: { description: 'Exemple : douceur-chocolat. Lettres minuscules, chiffres et tirets.' },
  validate: (value: unknown) => typeof value === 'string' && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value)
    || 'Utiliser des lettres minuscules, chiffres et tirets, sans espace.',
}

export const order: Field = {
  name: 'order', label: 'Ordre d’affichage', type: 'number', defaultValue: 0, required: true,
  validate: (value: unknown) => Number.isInteger(value) || 'L’ordre doit être un entier.',
}

export const featured: Field = { name: 'featured', label: 'Mettre en avant sur l’accueil', type: 'checkbox', defaultValue: false }

export const videoURL: Field = {
  name: 'embedURL', label: 'Vidéo YouTube ou Vimeo (facultative)', type: 'text',
  validate: (value: unknown) => {
    if (!value) return true
    if (typeof value !== 'string') return 'Adresse vidéo invalide.'
    try {
      const url = new URL(value)
      return url.protocol === 'https:' && !url.username && !url.password && (!url.port || url.port === '443')
        && ['youtube.com', 'www.youtube.com', 'youtu.be', 'vimeo.com', 'www.vimeo.com', 'player.vimeo.com'].includes(url.hostname)
        || 'Utiliser une URL HTTPS YouTube ou Vimeo.'
    } catch { return 'Adresse vidéo invalide.' }
  },
}
