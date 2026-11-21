/** Validación de número de tarjeta con el algoritmo de Luhn (solo dígitos). */
export function luhnValid(num: string): boolean {
  if (!/^\d{13,19}$/.test(num)) return false;
  let sum = 0;
  let alt = false;
  for (let i = num.length - 1; i >= 0; i--) {
    let d = num.charCodeAt(i) - 48;
    if (alt) {
      d *= 2;
      if (d > 9) d -= 9;
    }
    sum += d;
    alt = !alt;
  }
  return sum % 10 === 0;
}

/** Vigencia MM/AA válida y no vencida. */
export function expiryValid(exp: string, now = new Date()): boolean {
  const m = /^(0[1-9]|1[0-2])\/(\d{2})$/.exec(exp);
  if (!m) return false;
  const month = Number(m[1]);
  const year = 2000 + Number(m[2]);
  return year > now.getFullYear() || (year === now.getFullYear() && month >= now.getMonth() + 1);
}
