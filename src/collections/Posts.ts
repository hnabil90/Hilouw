import { APIError, type CollectionConfig } from 'payload'
import { editContent, guardCollectionDrafts, readPublished } from '../access/content.js'
import { isAdmin } from '../access/users.js'
import { image, seo, slug, videoURL } from '../fields/editorial.js'
import { exposePublicMedia } from '../hooks/publicMedia.js'

export const Posts: CollectionConfig = {
  slug: 'posts',
  labels: { singular: 'Actualité', plural: 'Actualités' },
  admin: { useAsTitle: 'title', group: 'Contenu éditorial', defaultColumns: ['title', '_status', 'publishedAt'] },
  defaultSort: '-publishedAt',
  access: { create: editContent, read: readPublished('posts'), update: editContent, delete: isAdmin, readVersions: editContent },
  versions: { drafts: { validate: true }, maxPerDoc: 25 },
  hooks: {
    beforeOperation: [guardCollectionDrafts],
    beforeRead: [exposePublicMedia()],
    beforeChange: [({ data, originalDoc }) => {
      const value = { ...originalDoc, ...data }
      if (value._status === 'published' && (!value.content || !value.cover || !value.publishedAt)) {
        throw new APIError('Avant publication, renseigner le contenu, la couverture et la date de publication.', 400)
      }
      return data
    }],
  },
  fields: [
    { name: 'title', label: 'Titre', type: 'text', required: true }, slug,
    { name: 'excerpt', label: 'Extrait', type: 'textarea', maxLength: 350 },
    image('cover', 'Image de couverture'),
    { name: 'content', label: 'Contenu', type: 'richText' },
    { name: 'gallery', label: 'Images et vidéos complémentaires', type: 'array', fields: [
      { name: 'asset', label: 'Média', type: 'upload', relationTo: 'media', required: true },
      { name: 'caption', label: 'Légende', type: 'text' },
    ] },
    videoURL,
    { name: 'publishedAt', label: 'Date de publication', type: 'date', index: true,
      admin: { date: { pickerAppearance: 'dayAndTime' }, description: 'Une date future masque l’article au public jusqu’à cette date.' } },
    { name: 'author', label: 'Auteur (facultatif)', type: 'relationship', relationTo: 'team' },
    seo,
  ],
}
