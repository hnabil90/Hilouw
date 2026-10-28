import { z } from 'zod'

export const contactSchema = z.object({
  name: z.string().trim().min(2, 'Indiquez votre nom.').max(100, 'Le nom est trop long.').refine((value) => !/[\r\n]/.test(value), 'Nom invalide.'),
  email: z.string().trim().email('Indiquez une adresse email valide.').max(254),
  subject: z.string().trim().min(2, 'Indiquez un sujet.').max(160, 'Le sujet est trop long.').refine((value) => !/[\r\n]/.test(value), 'Sujet invalide.'),
  message: z.string().trim().min(10, 'Votre message doit contenir au moins 10 caractères.').max(5000, 'Votre message ne doit pas dépasser 5 000 caractères.'),
  privacyAcknowledged: z.literal(true, { error: 'Veuillez prendre connaissance du traitement de vos données.' }),
  website: z.string().max(0, 'La soumission n’a pas pu être validée.').optional().default(''),
})

export type ContactInput = z.infer<typeof contactSchema>
export type ContactErrors = Partial<Record<keyof ContactInput, string>>

export function validationErrors(error: z.ZodError): ContactErrors {
  return Object.fromEntries(error.issues.map((issue) => [String(issue.path[0]), issue.message]))
}
