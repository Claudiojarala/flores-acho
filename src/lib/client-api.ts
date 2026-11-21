/** Cliente fetch tipado para la API REST (JSON + Bearer JWT). */
export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public details?: { field: string; message: string }[],
  ) {
    super(message);
  }
}

export async function api<T>(path: string, options: { method?: string; body?: unknown; token?: string | null } = {}): Promise<T> {
  const res = await fetch(path, {
    method: options.method ?? 'GET',
    headers: {
      ...(options.body !== undefined ? { 'Content-Type': 'application/json' } : {}),
      ...(options.token ? { Authorization: `Bearer ${options.token}` } : {}),
    },
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
  });
  const data = (await res.json().catch(() => ({}))) as { error?: string; details?: { field: string; message: string }[] };
  if (!res.ok) throw new ApiError(res.status, data.error ?? 'Error inesperado', data.details);
  return data as T;
}

export function errorMessage(err: unknown): string {
  if (err instanceof ApiError) {
    const extra = err.details?.map((d) => d.message).join('; ');
    return extra ? `${err.message}: ${extra}` : err.message;
  }
  return 'No se pudo completar la operación';
}
