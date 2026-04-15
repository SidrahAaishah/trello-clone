export class HttpError extends Error {
  status: number;
  code: string;
  details?: unknown;

  constructor(status: number, code: string, message: string, details?: unknown) {
    super(message);
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

export const notFound = (entity: string) =>
  new HttpError(404, 'NOT_FOUND', `${entity} not found`);

export const badRequest = (message: string, details?: unknown) =>
  new HttpError(400, 'BAD_REQUEST', message, details);

export const conflict = (message: string) =>
  new HttpError(409, 'CONFLICT', message);
