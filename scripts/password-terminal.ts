import { createInterface } from 'node:readline/promises'
import { Writable } from 'node:stream'

export function validatePasswordConfirmation(password: string, confirmation: string) {
  if (password.length < 12) throw new Error('Le mot de passe doit contenir au moins 12 caractères.')
  if (password !== confirmation) throw new Error('Les deux mots de passe ne correspondent pas. Aucun changement effectué.')
}

export function createPasswordTerminal() {
  if (!process.stdin.isTTY) throw new Error('Exécuter cette commande dans un terminal interactif.')
  let hidden = false
  const output = new Writable({ write(chunk, _encoding, callback) {
    if (!hidden) process.stdout.write(chunk)
    callback()
  } })
  const terminal = createInterface({ input: process.stdin, output, terminal: true })
  async function secretQuestion(label: string) {
    process.stdout.write(label)
    hidden = true
    try { return await terminal.question('') }
    finally { hidden = false; process.stdout.write('\n') }
  }
  return {
    question: (label: string) => terminal.question(label),
    async confirmedPassword() {
      const password = await secretQuestion('Mot de passe (12 caractères minimum, saisie masquée) : ')
      const confirmation = await secretQuestion('Confirmer le mot de passe (saisie masquée) : ')
      validatePasswordConfirmation(password, confirmation)
      return password
    },
    close: () => terminal.close(),
  }
}
