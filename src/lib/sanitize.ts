/**
 * Sanitización de texto libre (defensa XSS en la entrada):
 * - elimina caracteres de control,
 * - neutraliza "<" y ">" para que nunca pueda formarse una etiqueta HTML,
 * - colapsa espacios.
 * La salida además se escapa por defecto al renderizarse con React (defensa en profundidad).
 */
export function sanitizeText(input: string): string {
  return (
    input
      // eslint-disable-next-line no-control-regex
      .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '')
      .replace(/</g, '‹')
      .replace(/>/g, '›')
      .replace(/\s+/g, ' ')
      .trim()
  );
}
