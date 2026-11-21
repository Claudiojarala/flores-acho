/**
 * Capa de negocio – pagos (HU-11, HU-12, HU-13).
 * Pasarela SIMULADA detrás de una interfaz: en producción se reemplaza por Culqi, Niubiz o la API de Yape/Plin.
 * Nunca se registra ni se guarda el número de tarjeta, solo el resultado y una referencia.
 */
import { randomUUID } from 'node:crypto';

export type PaymentRequest =
  | { method: 'yape' | 'plin'; phone: string }
  | { method: 'tarjeta'; cardNumber: string; expiry: string; cvv: string }
  | { method: 'contraentrega' };

export interface PaymentResult {
  approved: boolean;
  status: 'pagado' | 'pendiente';
  reference: string | null;
  reason?: string;
}

export interface PaymentGateway {
  charge(req: PaymentRequest, amount: number): Promise<PaymentResult>;
}

/** Tarjeta de prueba que termina en 0002 → rechazada (para demostrar el flujo de error). */
export class SimulatedGateway implements PaymentGateway {
  async charge(req: PaymentRequest, amount: number): Promise<PaymentResult> {
    void amount;
    if (req.method === 'contraentrega') return { approved: true, status: 'pendiente', reference: null };
    if (req.method === 'tarjeta' && req.cardNumber.endsWith('0002')) {
      return { approved: false, status: 'pendiente', reference: null, reason: 'Tarjeta rechazada por el banco emisor' };
    }
    return { approved: true, status: 'pagado', reference: `SIM-${randomUUID().slice(0, 8).toUpperCase()}` };
  }
}

let gateway: PaymentGateway = new SimulatedGateway();
export const getGateway = (): PaymentGateway => gateway;
/** Solo para pruebas. */
export function setGateway(g: PaymentGateway): void {
  gateway = g;
}
