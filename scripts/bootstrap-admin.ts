import 'dotenv/config'
import { createInterface } from 'node:readline/promises'
import { Writable } from 'node:stream'
import { getPayload } from 'payload'
import config from '../src/payload.config.js'

let hidden = false
const output = new Writable({
  write(chunk, _encoding, callback) {
    if (!hidden) process.stdout.write(chunk)
    callback()
  },
})

async function main() {
  const payload = await getPayload({ config })
  const terminal = createInterface({ input: process.stdin, output, terminal: Boolean(process.stdin.isTTY) })
  try {
    const existing = await payload.count({ collection: 'users', overrideAccess: true })
    if (existing.totalDocs !== 0) {
      throw new Error('Un utilisateur existe déjà. Gérer les comptes depuis /admin.')
    }
    if (!process.stdin.isTTY) {
      throw new Error('Exécuter cette commande dans un terminal interactif (docker compose run --rm manage …).')
    }
    const email = (await terminal.question('Email administrateur : ')).trim()
    const name = (await terminal.question('Nom : ')).trim()
    process.stdout.write('Mot de passe (12 caractères minimum, saisie masquée) : ')
    hidden = true
    const password = await terminal.question('')
    hidden = false
    process.stdout.write('\n')
    if (!email || !name || password.length < 12) throw new Error('Email, nom et mot de passe de 12 caractères minimum requis.')

    await payload.create({
      collection: 'users',
      overrideAccess: true,
      data: { email, name, password, role: 'admin' },
    })
    console.log('Administrateur créé. Connexion possible sur /admin.')
  } finally {
    hidden = false
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
