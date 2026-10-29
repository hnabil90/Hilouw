import 'dotenv/config'
import { pathToFileURL } from 'node:url'
import { getPayload, type Payload } from 'payload'
import config from '../src/payload.config.js'
import { createPasswordTerminal, validatePasswordConfirmation } from './password-terminal.js'

export async function resetAdminPassword(payload: Payload, email: string, password: string, confirmation: string) {
  validatePasswordConfirmation(password, confirmation)
  const accounts = await payload.find({ collection: 'users', overrideAccess: true, depth: 0, limit: 2,
    where: { and: [{ email: { equals: email.trim().toLowerCase() } }, { role: { equals: 'admin' } }] } })
  if (accounts.docs.length !== 1) throw new Error('Aucun compte administrateur correspondant. Aucun changement effectué.')
  await payload.update({ collection: 'users', id: accounts.docs[0].id, overrideAccess: true, data: {
    password, loginAttempts: 0, lockUntil: null, sessions: [],
    resetPasswordToken: null, resetPasswordExpiration: null, resetPasswordRequestedAt: null,
  } })
}

async function main() {
  const terminal = createPasswordTerminal()
  const payload = await getPayload({ config })
  try {
    const email = await terminal.question('Email du compte administrateur à récupérer : ')
    const password = await terminal.confirmedPassword()
    await resetAdminPassword(payload, email, password, password)
    console.log('Mot de passe réinitialisé et compte déverrouillé. Les anciennes sessions ont été fermées.')
  } finally { terminal.close(); await payload.destroy() }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try { await main(); process.exit(0) }
  catch (error) { console.error(error instanceof Error ? error.message : 'Réinitialisation impossible.'); process.exit(1) }
}
