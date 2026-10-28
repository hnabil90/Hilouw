import { postgresAdapter } from '@payloadcms/db-postgres'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import { fr } from '@payloadcms/translations/languages/fr'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { buildConfig } from 'payload'
import sharp from 'sharp'
import { Users } from './collections/Users.js'
import { SiteSettings } from './globals/SiteSettings.js'
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
  collections: [Users],
  globals: [SiteSettings],
  editor: lexicalEditor(),
  secret,
  db: postgresAdapter({
    pool: { connectionString: requiredEnv('DATABASE_URL'), max: 10 },
    push: false,
    migrationDir: path.resolve(dirname, 'migrations'),
    prodMigrations: migrations,
  }),
  typescript: { outputFile: path.resolve(dirname, 'payload-types.ts') },
  graphQL: { disable: true },
  email: () => ({
    name: 'not-configured',
    defaultFromAddress: 'not-configured@example.invalid',
    defaultFromName: 'HILOUW',
    sendEmail: async () => { throw new Error('Service email non configuré à cette étape.') },
  }),
  sharp,
})
