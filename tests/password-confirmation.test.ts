import assert from 'node:assert/strict'
import { test } from 'node:test'
import { validatePasswordConfirmation } from '../scripts/password-terminal'

test('un mot de passe trop court ou différent de sa confirmation est refusé', () => {
  assert.throws(() => validatePasswordConfirmation('trop-court', 'trop-court'))
  assert.throws(() => validatePasswordConfirmation('mot-de-passe-assez-long', 'mot-de-passe-different'), /ne correspondent pas/)
})
test('les deux saisies doivent correspondre exactement, y compris les espaces', () => {
  assert.throws(() => validatePasswordConfirmation('mot-de-passe-assez-long', 'mot-de-passe-assez-long '))
  assert.doesNotThrow(() => validatePasswordConfirmation('mot-de-passe-assez-long', 'mot-de-passe-assez-long'))
})
