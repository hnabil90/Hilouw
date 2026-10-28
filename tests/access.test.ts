import assert from 'node:assert/strict'
import { test } from 'node:test'
import { isAdmin, isAdminField, isAdminOrSelf } from '../src/access/users.js'

type Args = Parameters<typeof isAdmin>[0]
const args = (user: unknown) => ({ req: { user } }) as Args

test('un visiteur ne peut pas accéder aux utilisateurs', () => {
  assert.equal(isAdmin(args(null)), false)
  assert.equal(isAdminOrSelf(args(null)), false)
})

test('un éditeur est limité à son compte et ne peut pas attribuer un rôle', () => {
  const editor = args({ id: 42, role: 'editor' })
  assert.equal(isAdmin(editor), false)
  assert.deepEqual(isAdminOrSelf(editor), { id: { equals: 42 } })
  assert.equal(isAdminField(editor as Parameters<typeof isAdminField>[0]), false)
})

test('un administrateur peut gérer les comptes', () => {
  assert.equal(isAdmin(args({ id: 1, role: 'admin' })), true)
  assert.equal(isAdminOrSelf(args({ id: 1, role: 'admin' })), true)
})
