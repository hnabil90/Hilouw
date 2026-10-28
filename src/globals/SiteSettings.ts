import type { GlobalConfig } from 'payload'
import { isAdmin } from '../access/users.js'

export const SiteSettings: GlobalConfig = {
  slug: 'site-settings',
  label: 'Identité du site',
  access: { read: () => true, update: isAdmin },
  fields: [
    { name: 'name', label: 'Nom de la marque', type: 'text', required: true, defaultValue: 'HILOUW' },
    { name: 'subtitle', label: 'Sous-titre', type: 'text', defaultValue: 'Douceurs & Créations' },
    { name: 'tagline', label: 'Signature', type: 'text', defaultValue: 'Le bniouen, tout simplement irrésistible.' },
    { name: 'holdingMessage', label: 'Message avant ouverture', type: 'textarea', defaultValue: 'Notre site est en préparation.' },
  ],
}
