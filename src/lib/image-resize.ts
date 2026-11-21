/**
 * Reduce una foto elegida por el comerciante antes de enviarla (solo navegador).
 * Se redimensiona a un máximo de 640 px y se comprime a JPEG para que quepa en la base de datos (≈ 50–120 KB).
 */
export async function fileToDataUrl(file: File, maxSide = 640): Promise<string> {
  if (!/^image\/(jpeg|png|webp)$/.test(file.type)) throw new Error('Usa una imagen JPG, PNG o WebP');
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('No se pudo procesar la imagen');
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  for (const quality of [0.8, 0.65, 0.5]) {
    const url = canvas.toDataURL('image/jpeg', quality);
    if (url.length <= 240_000) return url;
  }
  throw new Error('La foto es demasiado grande; elige una más pequeña');
}
