import { DELIVERY_ZONES } from '../data/zones';

export const round2 = (n: number): number => Math.round((n + Number.EPSILON) * 100) / 100;

export interface Priced {
  priceRetail: number;
  priceWholesale: number;
  wholesaleMinQty: number;
}

/** HU-07: precio mayorista automático cuando la cantidad alcanza el mínimo del producto. */
export function unitPriceFor(p: Priced, quantity: number): number {
  return quantity >= p.wholesaleMinQty ? p.priceWholesale : p.priceRetail;
}

export function lineTotal(p: Priced, quantity: number): number {
  return round2(unitPriceFor(p, quantity) * quantity);
}

/** HU-16: costo de delivery por distrito; undefined si el distrito no tiene cobertura. */
export function deliveryFeeFor(district: string): number | undefined {
  return DELIVERY_ZONES.find((z) => z.district === district)?.fee;
}
