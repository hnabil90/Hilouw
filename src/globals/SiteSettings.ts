import type { GlobalConfig } from 'payload'
import { isAdmin } from '../access/users.js'
import { cta, image, seo } from '../fields/editorial.js'
import { exposePublicMedia } from '../hooks/publicMedia.js'

export const SiteSettings: GlobalConfig = {
  slug: 'site-settings',
  label: 'Identité du site',
  access: { read: () => true, update: isAdmin },
  hooks: { beforeRead: [exposePublicMedia(false)] },
  fields: [
    { name: 'name', label: 'Nom de la marque', type: 'text', required: true, defaultValue: 'HILOUW' },
    { name: 'subtitle', label: 'Sous-titre', type: 'text', defaultValue: 'Douceurs & Créations' },
    { name: 'tagline', label: 'Signature', type: 'text', defaultValue: 'Des douceurs, tout simplement irrésistibles.' },
    { name: 'holdingMessage', label: 'Message avant ouverture', type: 'textarea', defaultValue: 'Notre site est en préparation.' },
    image('logo', 'Logo'),
    { name: 'contactEmail', label: 'Adresse email publique', type: 'email' },
    { name: 'phone', label: 'Téléphone public', type: 'text' },
    { name: 'address', label: 'Adresse publique', type: 'textarea' },
    { name: 'navigation', label: 'Navigation', type: 'array', maxRows: 8, fields: [cta('link', 'Lien')] },
    { name: 'socialLinks', label: 'Réseaux sociaux', type: 'array', fields: [cta('link', 'Lien')] },
    { name: 'footerText', label: 'Texte du pied de page', type: 'textarea' },
    seo,
  ],
}
