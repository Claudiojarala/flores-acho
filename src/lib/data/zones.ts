/** Zonas de delivery desde el Mercado de Flores de Acho (Rímac) con tarifa y tiempo estimado. */
export interface DeliveryZone {
  district: string;
  fee: number; // soles
  etaMinutes: number;
}

export const DELIVERY_ZONES: DeliveryZone[] = [
  { district: 'Rímac', fee: 5, etaMinutes: 30 },
  { district: 'Cercado de Lima', fee: 8, etaMinutes: 40 },
  { district: 'Breña', fee: 8, etaMinutes: 45 },
  { district: 'San Martín de Porres', fee: 10, etaMinutes: 50 },
  { district: 'Lince', fee: 10, etaMinutes: 50 },
  { district: 'Jesús María', fee: 10, etaMinutes: 50 },
  { district: 'Pueblo Libre', fee: 10, etaMinutes: 50 },
  { district: 'San Miguel', fee: 12, etaMinutes: 60 },
  { district: 'San Isidro', fee: 15, etaMinutes: 60 },
  { district: 'Miraflores', fee: 15, etaMinutes: 70 },
  { district: 'Surco', fee: 18, etaMinutes: 80 },
  { district: 'La Molina', fee: 20, etaMinutes: 90 },
];

export const ZONE_NAMES = DELIVERY_ZONES.map((z) => z.district) as [string, ...string[]];
