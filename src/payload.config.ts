import { postgresAdapter } from '@payloadcms/db-postgres'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import { fr } from '@payloadcms/translations/languages/fr'
import { s3Storage } from '@payloadcms/storage-s3'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { buildConfig } from 'payload'
import sharp from 'sharp'
import { Users } from './collections/Users.js'
import { Products } from './collections/Products.js'
import { Posts } from './collections/Posts.js'
import { Team } from './collections/Team.js'
import { Media } from './collections/Media.js'
import { SiteSettings } from './globals/SiteSettings.js'
import { Home, TeamPage, ContactPage, Terms, LegalNotice } from './globals/editorial.js'
import { requiredEnv, serverURL } from './lib/environment.js'
import { migrations } from './migrations/index.js'

const dirname = path.dirname(fileURLToPath(import.meta.url))
const url = serverURL()
const secret = requiredEnv('PAYLOAD_SECRET')
if (secret.length < 32) throw new Error('PAYLOAD_SECRET doit contenir au moins 32 caractères')

export default buildConfig({
  telemetry: false,
  serverURL: url,
  cors: [url],
  csrf: [url],
  cookiePrefix: 'hilouw',
  i18n: { supportedLanguages: { fr }, fallbackLanguage: 'fr' },
  admin: {
    user: Users.slug,
    importMap: { baseDir: dirname },
    meta: { titleSuffix: ' — HILOUW', robots: 'noindex, nofollow' },
  },
  collections: [Users, Products, Posts, Team, Media],
  globals: [SiteSettings, Home, TeamPage, ContactPage, Terms, LegalNotice],
  editor: lexicalEditor({ features: ({ defaultFeatures }) => defaultFeatures.filter((feature) => !['upload', 'relationship'].includes(feature.key)) }),
  secret,
  db: postgresAdapter({
    pool: { connectionString: requiredEnv('DATABASE_URL'), max: 10 },
    push: false,
    migrationDir: path.resolve(dirname, 'migrations'),
    prodMigrations: migrations,
  }),
  typescript: { outputFile: path.resolve(dirname, 'payload-types.ts') },
  graphQL: { disable: true },
  upload: { limits: { fileSize: 25 * 1024 * 1024 }, abortOnLimit: true },
  plugins: [s3Storage({
    enabled: Boolean(process.env.S3_BUCKET),
    alwaysInsertFields: true,
    bucket: process.env.S3_BUCKET || 'hilouw-unused',
    collections: { media: true },
    config: process.env.S3_BUCKET ? {
      region: requiredEnv('S3_REGION'),
      endpoint: process.env.S3_ENDPOINT || undefined,
      forcePathStyle: process.env.S3_FORCE_PATH_STYLE === 'true',
      credentials: {
        accessKeyId: requiredEnv('S3_ACCESS_KEY_ID'),
        secretAccessKey: requiredEnv('S3_SECRET_ACCESS_KEY'),
      },
    } : { region: 'us-east-1' },
  })],
  email: () => ({
    name: 'not-configured',
    defaultFromAddress: 'not-configured@example.invalid',
    defaultFromName: 'HILOUW',
    sendEmail: async () => { throw new Error('Service email non configuré à cette étape.') },
  }),
  sharp,
})
