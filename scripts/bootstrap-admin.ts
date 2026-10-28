import 'dotenv/config'
import { getPayload } from 'payload'
import config from '../src/payload.config.js'
import { createPasswordTerminal } from './password-terminal.js'

async function main() {
  const payload = await getPayload({ config })
  const terminal = createPasswordTerminal()
  try {
    const existing = await payload.count({ collection: 'users', overrideAccess: true })
    if (existing.totalDocs !== 0) {
      throw new Error('Un utilisateur existe déjà. Gérer les comptes depuis /admin.')
    }
    const email = (await terminal.question('Email administrateur : ')).trim()
    const name = (await terminal.question('Nom : ')).trim()
    const password = await terminal.confirmedPassword()
    if (!email || !name) throw new Error('Email et nom requis.')

    await payload.create({
      collection: 'users',
      overrideAccess: true,
      data: { email, name, password, role: 'admin' },
    })
    console.log('Administrateur créé. Connexion possible sur /admin.')
  } finally {
    terminal.close()
    await payload.destroy()
  }
}

// L’adaptateur PostgreSQL conserve un client de reconnexion après destroy().
// La commande est terminée ; fermer le processus comme le CLI Payload.
try {
  await main()
  process.exit(0)
} catch (error) {
  console.error(error instanceof Error ? error.message : 'Échec de création du compte.')
  process.exit(1)
}
