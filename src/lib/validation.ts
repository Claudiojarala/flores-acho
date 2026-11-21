import { z } from 'zod';
import { CATEGORIES, OCCASIONS, UNITS } from './data/catalog';
import { ZONE_NAMES } from './data/zones';
import { expiryValid, luhnValid } from './domain/payment';
import { sanitizeText } from './sanitize';

const text = (min: number, max: number) =>
  z.string().max(max * 2).transform(sanitizeText).pipe(z.string().min(min).max(max));

const id = z.string().min(1).max(64).regex(/^[0-9a-zA-Z-]+$/, 'Identificador inválido');
const phone = z.string().regex(/^9\d{8}$/, 'Celular de 9 dígitos que empiece con 9');
const money = z.number().min(0.1).max(10000);
/** Foto del producto: solo data URL de imagen raster (sin SVG ni URLs externas) y de tamaño acotado. */
const imageData = z
  .string()
  .max(250_000, 'La foto es demasiado grande')
  .regex(/^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/]+=*$/, 'Formato de foto no permitido (usa JPG, PNG o WebP)');

/* ───────── Cuentas (HU-22) ───────── */
export const registerSchema = z
  .object({
    mode: z.enum(['register', 'login']),
    email: z.email().max(120).transform((v) => v.toLowerCase().trim()),
    password: z
      .string()
      .min(8, 'La contraseña debe tener al menos 8 caracteres')
      .max(72)
      .regex(/[a-z]/, 'Debe incluir una minúscula')
      .regex(/[A-Z]/, 'Debe incluir una mayúscula')
      .regex(/[0-9]/, 'Debe incluir un número'),
    role: z.enum(['cliente', 'comerciante']).optional().default('cliente'),
    name: text(2, 60).optional(),
    stallName: text(3, 60).optional(),
    stallCode: z.string().max(10).regex(/^[A-Za-z]-?\d{1,3}$/, 'Número de puesto inválido (ej. A-12)').optional(),
  })
  .superRefine((v, ctx) => {
    if (v.mode !== 'register') return;
    if (!v.name) ctx.addIssue({ code: 'custom', path: ['name'], message: 'Ingresa tu nombre' });
    if (v.role === 'comerciante') {
      if (!v.stallName) ctx.addIssue({ code: 'custom', path: ['stallName'], message: 'Ingresa el nombre de tu puesto' });
      if (!v.stallCode) ctx.addIssue({ code: 'custom', path: ['stallCode'], message: 'Ingresa el número de tu puesto (ej. A-12)' });
    }
  });

/* ───────── Catálogo (HU-01…HU-05) ───────── */
const boolQuery = z
  .enum(['true', 'false'])
  .optional()
  .transform((v) => (v === undefined ? undefined : v === 'true'));

export const productQuerySchema = z.object({
  q: z.string().max(60).transform(sanitizeText).optional(),
  category: z.enum(CATEGORIES).optional(),
  occasion: z.enum(OCCASIONS).optional(),
  stallId: id.optional(),
  maxPrice: z.coerce.number().min(0).max(100000).optional(),
  inStock: boolQuery,
});

/* ───────── Panel del comerciante (HU-18, HU-19) ───────── */
export const productCreateSchema = z
  .object({
    name: text(3, 80),
    category: z.enum(CATEGORIES),
    occasions: z.array(z.enum(OCCASIONS)).max(OCCASIONS.length).default([]),
    description: text(0, 200).default(''),
    unit: z.enum(UNITS),
    priceRetail: money,
    priceWholesale: money,
    wholesaleMinQty: z.number().int().min(2).max(1000),
    stock: z.number().int().min(0).max(100000),
    imageUrl: imageData.nullish().transform((v) => v ?? null),
  })
  .refine((p) => p.priceWholesale <= p.priceRetail, { path: ['priceWholesale'], message: 'El precio mayorista no puede superar al minorista' });

export const productUpdateSchema = z
  .object({
    name: text(3, 80),
    description: text(0, 200),
    priceRetail: money,
    priceWholesale: money,
    wholesaleMinQty: z.number().int().min(2).max(1000),
    stock: z.number().int().min(0).max(100000),
    active: z.boolean(),
  })
  .partial()
  .strict()
  .refine((p) => Object.keys(p).length > 0, { message: 'No hay campos para actualizar' });

/* ───────── Pedidos y pagos (HU-06…HU-16) ───────── */
const paymentSchema = z.discriminatedUnion('method', [
  z.object({ method: z.literal('yape'), phone }),
  z.object({ method: z.literal('plin'), phone }),
  z.object({
    method: z.literal('tarjeta'),
    cardNumber: z.string().regex(/^\d{13,19}$/, 'Número de tarjeta inválido').refine(luhnValid, 'Número de tarjeta inválido'),
    expiry: z.string().refine((v) => expiryValid(v), 'Vigencia inválida (MM/AA)'),
    cvv: z.string().regex(/^\d{3,4}$/, 'CVV inválido'),
  }),
  z.object({ method: z.literal('contraentrega') }),
]);

export const checkoutSchema = z
  .object({
    items: z
      .array(z.object({ productId: id, quantity: z.number().int().min(1).max(500) }))
      .min(1, 'El carrito está vacío')
      .max(30),
    fulfillment: z.enum(['recojo', 'delivery']),
    district: z.enum(ZONE_NAMES).optional(),
    address: text(5, 120).optional(),
    contactName: text(2, 60),
    phone,
    payment: paymentSchema,
  })
  .superRefine((v, ctx) => {
    if (v.fulfillment === 'delivery') {
      if (!v.district) ctx.addIssue({ code: 'custom', path: ['district'], message: 'Elige el distrito de entrega' });
      if (!v.address) ctx.addIssue({ code: 'custom', path: ['address'], message: 'Ingresa la dirección de entrega' });
    }
  });

export const orderActionSchema = z.object({ action: z.enum(['cancel', 'advance']) });

export const orderListQuerySchema = z.object({ scope: z.enum(['mine', 'stall']).optional().default('mine') });
