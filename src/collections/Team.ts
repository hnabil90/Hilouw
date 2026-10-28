import type { CollectionConfig } from 'payload'
import { editContent, guardCollectionDrafts, readPublished } from '../access/content.js'
import { isAdmin } from '../access/users.js'
import { featured, image, order, seo } from '../fields/editorial.js'
import { exposePublicMedia } from '../hooks/publicMedia.js'

export const Team: CollectionConfig = {
  slug: 'team',
  labels: { singular: 'Membre de l’équipe', plural: 'Équipe' },
  admin: { useAsTitle: 'name', group: 'Contenu éditorial', defaultColumns: ['name', 'position', '_status', 'order'] },
  defaultSort: 'order',
  access: { create: editContent, read: readPublished('team'), update: editContent, delete: isAdmin, readVersions: editContent },
  versions: { drafts: { validate: true }, maxPerDoc: 25 },
  hooks: { beforeOperation: [guardCollectionDrafts], beforeRead: [exposePublicMedia()] },
  fields: [
    { name: 'name', label: 'Nom', type: 'text', required: true },
    { name: 'position', label: 'Fonction', type: 'text' },
    image('portrait', 'Portrait'),
    { name: 'biography', label: 'Biographie', type: 'richText' },
    featured, order, seo,
  ],
}
