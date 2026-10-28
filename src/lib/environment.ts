export function requiredEnv(name: string): string {
  const value = process.env[name]
  if (!value) throw new Error(`Variable serveur manquante : ${name}`)
  return value
}

export function serverURL(): string {
  const url = new URL(requiredEnv('NEXT_PUBLIC_SITE_URL'))
  if (!['http:', 'https:'].includes(url.protocol)) throw new Error('URL du site invalide')
  const loopback = ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname)
  if (process.env.NODE_ENV === 'production' && url.protocol !== 'https:' && !loopback) {
    throw new Error('HTTPS est requis en production')
  }
  return url.origin
}
