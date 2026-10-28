import { APIError, type CollectionConfig } from 'payload'
import { isAdmin, isAdminField, isAdminOrSelf } from '../access/users.js'

export const Users: CollectionConfig = {
  slug: 'users',
  labels: { singular: 'Utilisateur', plural: 'Utilisateurs' },
  admin: { useAsTitle: 'email', defaultColumns: ['email', 'name', 'role'] },
  auth: {
    tokenExpiration: 7200,
    maxLoginAttempts: 5,
    lockTime: 600000,
    cookies: {
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'Lax',
    },
  },
  access: {
    admin: ({ req: { user } }) => Boolean(user),
    create: isAdmin,
    read: isAdminOrSelf,
    update: isAdminOrSelf,
    delete: isAdmin,
    unlock: isAdmin,
  },
  endpoints: [
    {
      path: '/first-register',
      method: 'post',
      handler: () => Response.json({ error: 'Création initiale réservée à la commande serveur.' }, { status: 403 }),
    },
  ],
  hooks: {
    beforeValidate: [({ data }) => {
      if (data?.password && data.password.length < 12) {
        throw new APIError('Le mot de passe doit contenir au moins 12 caractères.', 400)
      }
      return data
    }],
  },
  fields: [
    { name: 'name', label: 'Nom', type: 'text', required: true },
    {
      name: 'role',
      label: 'Rôle',
      type: 'select',
      required: true,
      defaultValue: 'editor',
      saveToJWT: true,
      options: [
        { label: 'Administrateur', value: 'admin' },
        { label: 'Gestionnaire du catalogue', value: 'catalog-manager' },
        { label: 'Éditeur', value: 'editor' },
      ],
      access: { create: isAdminField, update: isAdminField },
    },
  ],
}
