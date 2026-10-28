import type { Field, GlobalConfig } from 'payload'
import { editContent, guardGlobalDrafts, readPublishedGlobal } from '../access/content.js'
import { isAdmin } from '../access/users.js'
import { cta, image, seo } from '../fields/editorial.js'
import { exposePublicMedia } from '../hooks/publicMedia.js'

function page(slug: string, label: string, fields: Field[], legal = false): GlobalConfig {
  return {
    slug, label,
    admin: { group: legal ? 'Informations légales' : 'Pages du site' },
    access: { read: legal ? ({ req }) => req.user?.role === 'admin' ? true : { _status: { equals: 'published' } } : readPublishedGlobal,
      update: legal ? isAdmin : editContent, readVersions: legal ? isAdmin : editContent },
    versions: { drafts: { validate: true }, max: 25 },
    hooks: { beforeOperation: [guardGlobalDrafts], beforeRead: [exposePublicMedia()] },
    fields: [...fields, seo],
  }
}

export const Home = page('home', 'Accueil', [
  { name: 'hero', label: 'Introduction visuelle', type: 'group', fields: [
    { name: 'title', label: 'Titre', type: 'text' },
    { name: 'text', label: 'Texte', type: 'textarea' },
    image('image', 'Photographie principale'), cta(),
  ] },
  { name: 'introduction', label: 'Présentation de HILOUW', type: 'richText' },
  { name: 'productsTitle', label: 'Titre des produits phares', type: 'text' },
  { name: 'showProducts', label: 'Afficher les produits phares', type: 'checkbox', defaultValue: true },
  { name: 'craftsmanship', label: 'Savoir-faire', type: 'group', fields: [
    { name: 'title', label: 'Titre', type: 'text' },
    { name: 'text', label: 'Texte', type: 'richText' }, image('image', 'Photographie'),
  ] },
  { name: 'postsTitle', label: 'Titre des actualités', type: 'text' },
  { name: 'showPosts', label: 'Afficher les dernières actualités', type: 'checkbox', defaultValue: true },
  { name: 'teamTitle', label: 'Titre de l’équipe', type: 'text' },
  { name: 'showTeam', label: 'Afficher un aperçu de l’équipe', type: 'checkbox', defaultValue: true },
  { name: 'contactText', label: 'Invitation au contact', type: 'textarea' }, cta('contactCTA', 'Bouton de contact'),
])

export const TeamPage = page('team-page', 'Page équipe', [
  { name: 'title', label: 'Titre', type: 'text' },
  { name: 'introduction', label: 'Introduction', type: 'richText' },
  { name: 'history', label: 'Histoire', type: 'richText' },
  { name: 'values', label: 'Valeurs', type: 'richText' }, image('image', 'Photographie'),
])

export const ContactPage = page('contact-page', 'Page contact', [
  { name: 'title', label: 'Titre', type: 'text' },
  { name: 'introduction', label: 'Introduction', type: 'richText' },
  { name: 'subjects', label: 'Sujets proposés', type: 'array', fields: [{ name: 'label', label: 'Sujet', type: 'text', required: true }] },
  { name: 'privacyInformation', label: 'Information sur les données personnelles', type: 'richText' },
  { name: 'consentLabel', label: 'Texte de consentement si applicable', type: 'textarea' },
])

const legalFields: Field[] = [
  { name: 'title', label: 'Titre', type: 'text' },
  { name: 'validationStatus', label: 'Validation du texte', type: 'select', required: true, defaultValue: 'provisional',
    options: [{ label: 'Provisoire — à faire valider', value: 'provisional' }, { label: 'Validé par le propriétaire', value: 'validated' }],
    admin: { description: 'Ce statut ne constitue pas une certification juridique.' } },
  { name: 'content', label: 'Texte', type: 'richText' },
  { name: 'lastReviewedAt', label: 'Date de dernière vérification', type: 'date' },
]

export const Terms = page('terms', 'Conditions générales de vente', legalFields, true)
export const LegalNotice = page('legal-notice', 'Mentions légales', [
  ...legalFields,
  { name: 'publisher', label: 'Informations sur l’éditeur', type: 'textarea' },
  { name: 'hosting', label: 'Informations sur l’hébergeur', type: 'textarea' },
  { name: 'contactDetails', label: 'Coordonnées légales', type: 'textarea' },
], true)
