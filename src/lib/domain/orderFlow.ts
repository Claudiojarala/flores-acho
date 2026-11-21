export type OrderStatus = 'pendiente' | 'preparando' | 'en_camino' | 'listo_recojo' | 'entregado' | 'cancelado';
export type Fulfillment = 'recojo' | 'delivery';

export const STATUS_LABEL: Record<OrderStatus, string> = {
  pendiente: 'Pendiente',
  preparando: 'Preparando',
  en_camino: 'En camino',
  listo_recojo: 'Listo para recoger',
  entregado: 'Entregado',
  cancelado: 'Cancelado',
};

/** Máquina de estados del pedido (HU-17 / HU-20). Devuelve null si ya no puede avanzar. */
export function nextStatus(current: OrderStatus, fulfillment: Fulfillment): OrderStatus | null {
  switch (current) {
    case 'pendiente':
      return 'preparando';
    case 'preparando':
      return fulfillment === 'delivery' ? 'en_camino' : 'listo_recojo';
    case 'en_camino':
    case 'listo_recojo':
      return 'entregado';
    default:
      return null;
  }
}

/** HU-10: el cliente solo puede cancelar mientras el comerciante no empezó a prepararlo. */
export function canCancel(status: OrderStatus): boolean {
  return status === 'pendiente';
}
