/** Soles con dos decimales: 45 → "S/ 45.00". */
export const money = (n: number): string => `S/ ${n.toFixed(2)}`;

/** "hace 5 min", "hace 2 h", "hace 3 d" */
export function timeAgo(iso: string, now = Date.now()): string {
  const diffMin = Math.max(0, Math.round((now - new Date(iso).getTime()) / 60000));
  if (diffMin < 1) return 'hace instantes';
  if (diffMin < 60) return `hace ${diffMin} min`;
  const hours = Math.round(diffMin / 60);
  if (hours < 24) return `hace ${hours} h`;
  return `hace ${Math.round(hours / 24)} d`;
}

export function shortTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' });
}

export const unitLabel = (unit: string, qty = 1): string => {
  const plural: Record<string, string> = { docena: 'docenas', unidad: 'unidades', arreglo: 'arreglos', corona: 'coronas', maceta: 'macetas' };
  return qty === 1 ? unit : (plural[unit] ?? unit);
};
