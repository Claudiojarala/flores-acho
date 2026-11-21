/** Error controlado de la API: lleva el código HTTP que se debe responder. */
export class HttpError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly headers?: Record<string, string>,
  ) {
    super(message);
    this.name = 'HttpError';
  }
}
