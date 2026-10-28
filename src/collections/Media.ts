import { randomUUID } from 'node:crypto'
import path from 'node:path'
import { APIError, type CollectionConfig } from 'payload'
import sharp from 'sharp'
import { isStaff, manageMedia } from '../access/content.js'
import { editMedia, readMedia } from '../access/media.js'
import { imageMimeTypes } from '../fields/editorial.js'

export const Media: CollectionConfig = {
  slug: 'media',
  labels: { singular: 'Média', plural: 'Médiathèque' },
  admin: { useAsTitle: 'alt', group: 'Médias', defaultColumns: ['filename', 'alt', 'scope', 'mimeType'] },
  access: { create: manageMedia, read: readMedia, update: editMedia, delete: editMedia },
  upload: {
    staticDir: path.resolve(process.cwd(), 'media'),
    mimeTypes: [...imageMimeTypes, 'video/mp4', 'video/webm'],
    pasteURL: false,
    adminThumbnail: 'thumbnail',
    imageSizes: [
      { name: 'thumbnail', width: 480, withoutEnlargement: true },
      { name: 'card', width: 960, withoutEnlargement: true },
      { name: 'large', width: 1600, withoutEnlargement: true },
    ],
    constructorOptions: { limitInputPixels: 40000000 },
    withMetadata: false,
    modifyResponseHeaders: ({ headers }) => {
      headers.set('Cache-Control', 'private, no-store')
      headers.set('X-Content-Type-Options', 'nosniff')
      return headers
    },
  },
  hooks: {
    beforeOperation: [async ({ args, req, operation, overrideAccess }) => {
      if (operation !== 'create' && operation !== 'update') return args
      if (!isStaff(req.user) && !overrideAccess) throw new APIError('Connexion et droits médias requis.', 403)
      const file = req.file
      if (file) {
        if (file.size > 25 * 1024 * 1024) throw new APIError('La taille maximale est de 25 Mo.', 400)
        if (imageMimeTypes.includes(file.mimetype)) {
          const metadata = await sharp(file.data, { limitInputPixels: 40000000 }).metadata()
          const expected = { 'image/jpeg': 'jpeg', 'image/png': 'png', 'image/webp': 'webp' }[file.mimetype]
          if (metadata.format !== expected || file.size > 10 * 1024 * 1024) {
            throw new APIError('Image invalide ou supérieure à 10 Mo.', 400)
          }
        } else if (file.mimetype === 'video/mp4') {
          if (file.data.subarray(4, 8).toString() !== 'ftyp') throw new APIError('Fichier MP4 invalide.', 400)
        } else if (file.mimetype === 'video/webm') {
          if (file.data.subarray(0, 4).toString('hex') !== '1a45dfa3') throw new APIError('Fichier WebM invalide.', 400)
        } else throw new APIError('Format de fichier non autorisé.', 400)
        // Des noms opaques évitent collisions et noms de fichiers malveillants.
        const extension = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp', 'video/mp4': 'mp4', 'video/webm': 'webm' }[file.mimetype]
        file.name = `${randomUUID()}.${extension}`
      }
      return args
    }],
    beforeValidate: [({ data, originalDoc, req, operation }) => {
      if (!data) return data
      if (operation === 'create') data.scope ??= req.user?.role === 'catalog-manager' ? 'catalog' : 'editorial'
      if (req.user && req.user.role !== 'admin') {
        const permitted = req.user.role === 'catalog-manager' ? 'catalog' : 'editorial'
        if ((data.scope ?? originalDoc?.scope) !== permitted) throw new APIError('Ce média appartient à un autre espace.', 403)
      }
      return data
    }],
  },
  fields: [
    { name: 'alt', label: 'Description accessible du média', type: 'text', required: true,
      admin: { description: 'Décrire le contenu réel de l’image ou de la vidéo.' } },
    { name: 'caption', label: 'Légende', type: 'text' },
    { name: 'credit', label: 'Crédit', type: 'text' },
    { name: 'scope', label: 'Espace', type: 'select', required: true, index: true,
      options: [{ label: 'Catalogue', value: 'catalog' }, { label: 'Éditorial', value: 'editorial' }],
      admin: { description: 'Les gestionnaires du catalogue modifient les médias Catalogue ; les éditeurs modifient les médias Éditorial.' } },
  ],
}
