import { describe, expect, it } from 'vitest';
import { canCancel, nextStatus } from '@/lib/domain/orderFlow';
import { expiryValid, luhnValid } from '@/lib/domain/payment';
import { deliveryFeeFor, lineTotal, round2, unitPriceFor } from '@/lib/domain/pricing';

const rosas = { priceRetail: 45, priceWholesale: 36, wholesaleMinQty: 10 };

describe('precios (HU-07, HU-16)', () => {
  it('usa precio minorista bajo el mínimo y mayorista desde el mínimo', () => {
    expect(unitPriceFor(rosas, 9)).toBe(45);
    expect(unitPriceFor(rosas, 10)).toBe(36);
    expect(unitPriceFor(rosas, 50)).toBe(36);
  });

  it('calcula el total de línea sin errores de punto flotante', () => {
    expect(lineTotal(rosas, 3)).toBe(135);
    expect(lineTotal({ priceRetail: 0.1, priceWholesale: 0.1, wholesaleMinQty: 99 }, 3)).toBe(0.3);
    expect(round2(1.005)).toBe(1.01);
  });

  it('tarifa de delivery por distrito; sin cobertura devuelve undefined', () => {
    expect(deliveryFeeFor('Rímac')).toBe(5);
    expect(deliveryFeeFor('Miraflores')).toBe(15);
    expect(deliveryFeeFor('Narnia')).toBeUndefined();
  });
});

describe('estados del pedido (HU-17, HU-20)', () => {
  it('delivery: pendiente → preparando → en camino → entregado', () => {
    expect(nextStatus('pendiente', 'delivery')).toBe('preparando');
    expect(nextStatus('preparando', 'delivery')).toBe('en_camino');
    expect(nextStatus('en_camino', 'delivery')).toBe('entregado');
    expect(nextStatus('entregado', 'delivery')).toBeNull();
  });

  it('recojo: pasa por "listo para recoger"', () => {
    expect(nextStatus('preparando', 'recojo')).toBe('listo_recojo');
    expect(nextStatus('listo_recojo', 'recojo')).toBe('entregado');
  });

  it('un pedido cancelado no avanza y solo se cancela si está pendiente (HU-10)', () => {
    expect(nextStatus('cancelado', 'delivery')).toBeNull();
    expect(canCancel('pendiente')).toBe(true);
    expect(canCancel('preparando')).toBe(false);
  });
});

describe('tarjetas simuladas (HU-12)', () => {
  it('Luhn', () => {
    expect(luhnValid('4111111111111111')).toBe(true);
    expect(luhnValid('4111111111111112')).toBe(false);
    expect(luhnValid('abcd')).toBe(false);
  });

  it('vigencia', () => {
    const now = new Date('2026-11-21');
    expect(expiryValid('11/26', now)).toBe(true);
    expect(expiryValid('10/26', now)).toBe(false);
    expect(expiryValid('13/30', now)).toBe(false);
  });
});
