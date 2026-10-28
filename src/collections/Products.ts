import { APIError, type CollectionConfig } from 'payload'
import { isAdmin } from '../access/users.js'
import { guardCollectionDrafts, manageCatalog, readPublished } from '../access/content.js'
import { cta, featured, image, order, seo, slug } from '../fields/editorial.js'
import { exposePublicMedia } from '../hooks/publicMedia.js'

export const Products: CollectionConfig = {
  slug: 'products',
  labels: { singular: 'Produit', plural: 'Produits' },
  admin: { useAsTitle: 'name', group: 'Catalogue', defaultColumns: ['name', '_status', 'archived', 'featured', 'order'] },
  defaultSort: 'order',
  access: { create: manageCatalog, read: readPublished('products'), update: manageCatalog, delete: isAdmin, readVersions: manageCatalog },
  versions: { drafts: { validate: true }, maxPerDoc: 25 },
  hooks: {
    beforeOperation: [guardCollectionDrafts],
    beforeRead: [exposePublicMedia()],
    beforeChange: [({ data, originalDoc }) => {
      const value = { ...originalDoc, ...data }
      if (value._status === 'published' && (!value.description || !value.allergenInformation || !value.gallery?.length || value.gallery.some((row: { image?: unknown }) => !row.image))) {
        throw new APIError('Avant publication, renseigner la description, les allergènes et au moins une photo.', 400)
      }
      return data
    }],
  },
  fields: [
    { name: 'name', label: 'Nom', type: 'text', required: true },
    slug,
    { name: 'summary', label: 'Présentation courte', type: 'textarea', maxLength: 350 },
    { name: 'description', label: 'Description', type: 'richText' },
    { name: 'gallery', label: 'Photographies', type: 'array', maxRows: 12, fields: [image('image', 'Photographie')] },
    { name: 'price', label: 'Prix facultatif', type: 'group', fields: [
      { name: 'amount', label: 'Montant en centimes', type: 'number', min: 0,
        admin: { description: 'Laisser vide pour masquer le prix. Exemple : 1250 pour 12,50 €.' },
        validate: (value: unknown) => value == null || (Number.isSafeInteger(value) && Number(value) >= 0) || 'Utiliser un nombre entier positif de centimes.' },
      { name: 'currency', label: 'Devise', type: 'text', defaultValue: 'EUR',
        validate: (value: unknown) => !value || typeof value === 'string' && /^[A-Z]{3}$/.test(value) || 'Code monétaire à trois lettres (ex. EUR).' },
    ] },
    { name: 'allergenInformation', label: 'Informations sur les allergènes', type: 'textarea',
      admin: { description: 'À renseigner et vérifier avant publication, y compris les traces éventuelles.' } },
    { name: 'usefulInformation', label: 'Conservation et informations utiles', type: 'richText' },
    cta(), featured, order,
    { name: 'archived', label: 'Archiver (retirer du catalogue public)', type: 'checkbox', defaultValue: false, index: true },
    seo,
  ],
}
