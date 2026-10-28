import { APIError, type Access, type CollectionBeforeOperationHook, type GlobalBeforeOperationHook, type PayloadRequest, type Where } from 'payload'

export type ContentRole = 'admin' | 'editor' | 'catalog-manager'
type Actor = { role?: string | null } | null | undefined

export const canManageCatalog = (user: Actor) => user?.role === 'admin' || user?.role === 'catalog-manager'
export const canEditContent = (user: Actor) => user?.role === 'admin' || user?.role === 'editor'
export const isStaff = (user: Actor) => canManageCatalog(user) || canEditContent(user)

export const manageCatalog: Access = ({ req }) => canManageCatalog(req.user)
export const editContent: Access = ({ req }) => canEditContent(req.user)
export const manageMedia: Access = ({ req }) => isStaff(req.user)

export function publishedWhere(kind: 'products' | 'posts' | 'team'): Where {
  const and: Where[] = [{ _status: { equals: 'published' } }]
  if (kind === 'products') and.push({ archived: { not_equals: true } })
  if (kind === 'posts') and.push({ publishedAt: { less_than_equal: new Date().toISOString() } })
  return { and }
}

export const readPublished = (kind: 'products' | 'posts' | 'team'): Access => ({ req }) =>
  (kind === 'products' ? canManageCatalog(req.user) : canEditContent(req.user)) ? true : publishedWhere(kind)

// Une lecture publique ne doit jamais pouvoir demander la dernière version brouillon.
function guardDrafts(args: { draft?: boolean; overrideAccess?: boolean } | undefined, req: PayloadRequest, allowed: boolean, overrideAccess?: boolean) {
  if (args?.draft && !allowed && !(overrideAccess ?? args.overrideAccess)) {
    throw new APIError('Les brouillons sont réservés aux utilisateurs autorisés.', 403)
  }
}

export const guardCollectionDrafts: CollectionBeforeOperationHook = ({ args, collection, operation, req, overrideAccess }) => {
  if (operation === 'read') guardDrafts(args, req,
    collection.slug === 'products' ? canManageCatalog(req.user) : canEditContent(req.user), overrideAccess)
  return args
}

export const guardGlobalDrafts: GlobalBeforeOperationHook = ({ args, global, operation, req, overrideAccess }) => {
  const allowed = ['terms', 'legal-notice'].includes(global.slug) ? req.user?.role === 'admin' : canEditContent(req.user)
  if (operation === 'read') guardDrafts(args, req, allowed, overrideAccess)
  return args
}

export const readPublishedGlobal: Access = ({ req }) => canEditContent(req.user) ? true : { _status: { equals: 'published' } }
