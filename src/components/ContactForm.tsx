'use client'

import { useRef, useState, type FormEvent } from 'react'
import { contactSchema, validationErrors, type ContactErrors } from '@/lib/contact-schema'

export function ContactForm({ available, subjects, consentLabel, initialProduct }: {
  available: boolean; subjects: string[]; consentLabel?: string | null; initialProduct?: string
}) {
  const [errors, setErrors] = useState<ContactErrors>({})
  const [busy, setBusy] = useState(false)
  const [success, setSuccess] = useState(false)
  const [message, setMessage] = useState('')
  const status = useRef<HTMLParagraphElement>(null)
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (busy || !available) return
    const form = event.currentTarget
    const values = new FormData(form)
    const input = { name: values.get('name'), email: values.get('email'), subject: values.get('subject'), message: values.get('message'),
      privacyAcknowledged: values.get('privacyAcknowledged') === 'on', website: values.get('website') || '' }
    const parsed = contactSchema.safeParse(input)
    if (!parsed.success) {
      const fields = validationErrors(parsed.error)
      setErrors(fields)
      form.querySelector<HTMLElement>(`[name="${Object.keys(fields)[0]}"]`)?.focus()
      return
    }
    setErrors({}); setMessage(''); setBusy(true)
    try {
      const response = await fetch('/api/contact', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(parsed.data), signal: AbortSignal.timeout(25000) })
      const body = await response.json()
      if (!response.ok) { setErrors(body.fields || {}); setMessage(body.error || 'L’envoi a échoué. Réessayez dans quelques instants.'); return }
      setSuccess(true)
      setMessage(body.message)
      form.reset()
    } catch { setMessage('La connexion a été interrompue. Vérifiez votre connexion puis réessayez.') }
    finally { setBusy(false); requestAnimationFrame(() => status.current?.focus()) }
  }
  if (success) return <div className="contact-success" role="status"><h2>Merci pour votre message.</h2><p>{message}</p><button className="btn btn-outline" onClick={() => { setSuccess(false); setMessage('') }}>Écrire un autre message</button></div>
  const error = (name: keyof ContactErrors) => errors[name] ? <span className="field-error" id={`${name}-error`}>{errors[name]}</span> : null
  return <form onSubmit={submit} className="contact-form" noValidate aria-busy={busy}>
    {!available && <p className="form-notice">Le formulaire est momentanément indisponible. Les coordonnées disponibles figurent sur cette page.</p>}
    <fieldset disabled={busy || !available}><legend className="sr-only">Votre message à HILOUW</legend><div className="form-row">
      <label htmlFor="name">Votre nom <span aria-hidden="true">*</span><input className="input" id="name" name="name" autoComplete="name" required maxLength={100} aria-invalid={Boolean(errors.name)} aria-describedby={errors.name ? 'name-error' : undefined} />{error('name')}</label>
      <label htmlFor="email">Votre email <span aria-hidden="true">*</span><input className="input" id="email" name="email" type="email" autoComplete="email" required maxLength={254} aria-invalid={Boolean(errors.email)} aria-describedby={errors.email ? 'email-error' : undefined} />{error('email')}</label></div>
      <label htmlFor="subject">Le sujet <span aria-hidden="true">*</span><input className="input" id="subject" name="subject" list="contact-subjects" required maxLength={160} defaultValue={initialProduct ? `À propos de ${initialProduct}`.slice(0, 160) : ''} aria-invalid={Boolean(errors.subject)} aria-describedby={errors.subject ? 'subject-error' : undefined} />
        <datalist id="contact-subjects">{subjects.map((subject) => <option key={subject} value={subject} />)}</datalist>{error('subject')}</label>
      <label htmlFor="message">Votre message <span aria-hidden="true">*</span><textarea className="textarea" id="message" name="message" required minLength={10} maxLength={5000} rows={6} aria-invalid={Boolean(errors.message)} aria-describedby={errors.message ? 'message-error' : 'message-hint'} />{error('message')}<span id="message-hint" className="field-hint">10 à 5 000 caractères.</span></label>
      <div className="honeypot" aria-hidden="true"><label htmlFor="website">Votre site web<input id="website" name="website" type="text" tabIndex={-1} autoComplete="off" /></label></div>
      <label className="privacy-checkbox"><input type="checkbox" name="privacyAcknowledged" required aria-invalid={Boolean(errors.privacyAcknowledged)} aria-describedby={errors.privacyAcknowledged ? 'privacyAcknowledged-error privacy-explanation' : 'privacy-explanation'} />
        <span>{consentLabel || 'J’ai pris connaissance du traitement de mes données pour répondre à ma demande.'}</span></label>{error('privacyAcknowledged')}
      <p className="field-hint" id="privacy-explanation">Les champs marqués d’un astérisque sont nécessaires pour répondre à votre message. Ces informations servent uniquement à traiter votre demande.</p>
      <button className="btn brand-button" type="submit">{busy ? 'Envoi en cours…' : 'Envoyer mon message'}<span aria-hidden="true">↗</span></button></fieldset>
    <p ref={status} className={message ? 'form-status' : ''} role="status" aria-live="polite" tabIndex={-1}>{message}</p>
  </form>
}
