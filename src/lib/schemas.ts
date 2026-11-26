import { z } from 'zod';

const phone = z
  .string()
  .trim()
  .regex(/^[+0-9][0-9 /()-]{5,19}$/, 'Bitte eine gültige Telefonnummer eingeben.');

export const checkoutSchema = z
  .object({
    mode: z.enum(['lieferung', 'abholung']),
    name: z.string().trim().min(2, 'Bitte gib deinen Namen an.').max(80),
    email: z.email('Bitte eine gültige E-Mail-Adresse eingeben.'),
    phone,
    street: z.string().trim().max(120),
    plz: z.string().trim(),
    city: z.string().trim().max(60),
    floor: z.string().trim().max(60),
    note: z.string().trim().max(240),
    when: z.string().min(1, 'Bitte wähle eine Zeit.'),
    payment: z.enum(['karte', 'paypal', 'bar']),
    agb: z.boolean().refine((v) => v, 'Bitte bestätige die Bedingungen.'),
  })
  .superRefine((v, ctx) => {
    if (v.mode !== 'lieferung') return;
    if (v.street.length < 4) ctx.addIssue({ code: 'custom', path: ['street'], message: 'Bitte Straße und Hausnummer angeben.' });
    if (!/^\d{5}$/.test(v.plz)) ctx.addIssue({ code: 'custom', path: ['plz'], message: 'Bitte eine fünfstellige Postleitzahl eingeben.' });
    if (v.city.length < 2) ctx.addIssue({ code: 'custom', path: ['city'], message: 'Bitte den Ort angeben.' });
  });

export type CheckoutInput = z.infer<typeof checkoutSchema>;

export const loginSchema = z.object({
  email: z.email('Bitte eine gültige E-Mail-Adresse eingeben.'),
  password: z.string().min(6, 'Mindestens 6 Zeichen.'),
});
export type LoginInput = z.infer<typeof loginSchema>;

export const menuItemSchema = z.object({
  name: z.string().trim().min(2, 'Name zu kurz.').max(60),
  desc: z.string().trim().min(4, 'Bitte Zutaten angeben.').max(160),
  price: z
    .string()
    .trim()
    .regex(/^\d{1,3}([.,]\d{1,2})?$/, 'Preis wie 12,50 eingeben.'),
});
export type MenuItemInput = z.infer<typeof menuItemSchema>;

export const parseEuro = (v: string) => Math.round(Number(v.replace(',', '.')) * 100);
