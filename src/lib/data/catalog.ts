/** Catálogo de referencia del Mercado de Flores de Acho (datos de demostración). */

export const CATEGORIES = ['rosas', 'girasoles', 'claveles', 'crisantemos', 'arreglos', 'coronas', 'plantas'] as const;
export type Category = (typeof CATEGORIES)[number];

export const OCCASIONS = ['san_valentin', 'dia_madre', 'todos_santos', 'eventos', 'condolencias', 'cumpleanos'] as const;
export type Occasion = (typeof OCCASIONS)[number];

export const UNITS = ['docena', 'unidad', 'arreglo', 'corona', 'maceta'] as const;
export type Unit = (typeof UNITS)[number];

export const CATEGORY_LABEL: Record<Category, string> = {
  rosas: 'Rosas',
  girasoles: 'Girasoles',
  claveles: 'Claveles',
  crisantemos: 'Crisantemos',
  arreglos: 'Arreglos florales',
  coronas: 'Coronas',
  plantas: 'Plantas',
};

export const OCCASION_LABEL: Record<Occasion, string> = {
  san_valentin: 'San Valentín',
  dia_madre: 'Día de la Madre',
  todos_santos: 'Todos los Santos',
  eventos: 'Eventos y bodas',
  condolencias: 'Condolencias',
  cumpleanos: 'Cumpleaños',
};

export interface SeedStall {
  id: string;
  name: string;
  code: string;
  description: string;
}

export interface SeedProduct {
  id: string;
  stallId: string;
  name: string;
  category: Category;
  occasions: Occasion[];
  description: string;
  unit: Unit;
  priceRetail: number;
  priceWholesale: number;
  wholesaleMinQty: number;
  stock: number;
}

const sid = (n: number) => `a0000000-0000-4000-8000-${String(n).padStart(12, '0')}`;
const pid = (n: number) => `b0000000-0000-4000-8000-${String(n).padStart(12, '0')}`;

export const SEED_STALLS: SeedStall[] = [
  { id: sid(1), name: 'Flores Doña Rosa', code: 'A-12', description: 'Rosas importadas y nacionales, ramos para San Valentín.' },
  { id: sid(2), name: 'Girasoles del Rímac', code: 'B-05', description: 'Girasoles y flores de campo directo de chacra.' },
  { id: sid(3), name: 'Arreglos Acho Premium', code: 'C-21', description: 'Arreglos para eventos, bodas y aniversarios.' },
  { id: sid(4), name: 'Coronas San Martín', code: 'D-03', description: 'Coronas fúnebres y arreglos para Todos los Santos.' },
  { id: sid(5), name: 'Claveles Don Julio', code: 'A-30', description: 'Claveles y crisantemos al por mayor y menor.' },
  { id: sid(6), name: 'Jardín de Mamá', code: 'B-18', description: 'Plantas en maceta y detalles para el Día de la Madre.' },
];

export const SEED_PRODUCTS: SeedProduct[] = [
  { id: pid(1), stallId: sid(1), name: 'Rosas rojas premium', category: 'rosas', occasions: ['san_valentin', 'cumpleanos'], description: 'Docena de rosas rojas de tallo largo.', unit: 'docena', priceRetail: 45, priceWholesale: 36, wholesaleMinQty: 10, stock: 120 },
  { id: pid(2), stallId: sid(1), name: 'Rosas rosadas', category: 'rosas', occasions: ['dia_madre', 'cumpleanos'], description: 'Docena de rosas rosadas frescas.', unit: 'docena', priceRetail: 38, priceWholesale: 30, wholesaleMinQty: 10, stock: 90 },
  { id: pid(3), stallId: sid(1), name: 'Ramo de 24 rosas', category: 'rosas', occasions: ['san_valentin'], description: 'Ramo grande de 24 rosas con follaje y papel de regalo.', unit: 'unidad', priceRetail: 95, priceWholesale: 80, wholesaleMinQty: 5, stock: 40 },
  { id: pid(4), stallId: sid(2), name: 'Girasoles', category: 'girasoles', occasions: ['cumpleanos', 'eventos'], description: 'Docena de girasoles grandes.', unit: 'docena', priceRetail: 30, priceWholesale: 24, wholesaleMinQty: 8, stock: 70 },
  { id: pid(5), stallId: sid(2), name: 'Ramo de girasoles y margaritas', category: 'girasoles', occasions: ['dia_madre', 'cumpleanos'], description: 'Ramo mixto alegre de girasoles y margaritas.', unit: 'unidad', priceRetail: 55, priceWholesale: 45, wholesaleMinQty: 5, stock: 35 },
  { id: pid(6), stallId: sid(3), name: 'Arreglo para boda', category: 'arreglos', occasions: ['eventos'], description: 'Centro de mesa de rosas blancas y gypsophila.', unit: 'arreglo', priceRetail: 120, priceWholesale: 95, wholesaleMinQty: 6, stock: 25 },
  { id: pid(7), stallId: sid(3), name: 'Arreglo de lirios', category: 'arreglos', occasions: ['eventos', 'dia_madre'], description: 'Arreglo en base de cerámica con lirios y rosas.', unit: 'arreglo', priceRetail: 150, priceWholesale: 125, wholesaleMinQty: 4, stock: 18 },
  { id: pid(8), stallId: sid(3), name: 'Caja de rosas y chocolates', category: 'arreglos', occasions: ['san_valentin', 'cumpleanos'], description: 'Caja de regalo con rosas preservadas y chocolates.', unit: 'arreglo', priceRetail: 110, priceWholesale: 90, wholesaleMinQty: 5, stock: 30 },
  { id: pid(9), stallId: sid(4), name: 'Corona fúnebre grande', category: 'coronas', occasions: ['condolencias', 'todos_santos'], description: 'Corona de claveles blancos y crisantemos con cinta.', unit: 'corona', priceRetail: 180, priceWholesale: 150, wholesaleMinQty: 3, stock: 20 },
  { id: pid(10), stallId: sid(4), name: 'Corona mediana', category: 'coronas', occasions: ['condolencias', 'todos_santos'], description: 'Corona mediana de flores mixtas.', unit: 'corona', priceRetail: 120, priceWholesale: 98, wholesaleMinQty: 3, stock: 28 },
  { id: pid(11), stallId: sid(4), name: 'Ramo para el cementerio', category: 'crisantemos', occasions: ['todos_santos'], description: 'Ramo de crisantemos y gladiolos para ofrenda.', unit: 'unidad', priceRetail: 35, priceWholesale: 28, wholesaleMinQty: 10, stock: 80 },
  { id: pid(12), stallId: sid(5), name: 'Claveles surtidos', category: 'claveles', occasions: ['dia_madre', 'cumpleanos'], description: 'Docena de claveles de colores.', unit: 'docena', priceRetail: 20, priceWholesale: 15, wholesaleMinQty: 12, stock: 200 },
  { id: pid(13), stallId: sid(5), name: 'Crisantemos blancos', category: 'crisantemos', occasions: ['todos_santos', 'condolencias'], description: 'Docena de crisantemos blancos.', unit: 'docena', priceRetail: 28, priceWholesale: 22, wholesaleMinQty: 10, stock: 150 },
  { id: pid(14), stallId: sid(5), name: 'Claveles rojos', category: 'claveles', occasions: ['san_valentin', 'dia_madre'], description: 'Docena de claveles rojos.', unit: 'docena', priceRetail: 22, priceWholesale: 17, wholesaleMinQty: 12, stock: 160 },
  { id: pid(15), stallId: sid(6), name: 'Orquídea phalaenopsis', category: 'plantas', occasions: ['dia_madre', 'cumpleanos'], description: 'Orquídea en maceta decorativa.', unit: 'maceta', priceRetail: 65, priceWholesale: 52, wholesaleMinQty: 6, stock: 45 },
  { id: pid(16), stallId: sid(6), name: 'Suculentas en mini maceta', category: 'plantas', occasions: ['cumpleanos', 'eventos'], description: 'Set de 3 suculentas en macetas pequeñas.', unit: 'maceta', priceRetail: 25, priceWholesale: 19, wholesaleMinQty: 10, stock: 100 },
  { id: pid(17), stallId: sid(6), name: 'Ramo del Día de la Madre', category: 'arreglos', occasions: ['dia_madre'], description: 'Ramo con rosas, lirios y claveles, tarjeta incluida.', unit: 'unidad', priceRetail: 75, priceWholesale: 60, wholesaleMinQty: 6, stock: 50 },
];
