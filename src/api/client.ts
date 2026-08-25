const configuredBase = (import.meta.env.VITE_API_BASE_URL as string | undefined)?.trim();
export const API_BASE_URL = configuredBase ? configuredBase.replace(/\/$/, '') : '';

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly technicalDetail?: unknown,
    public readonly correlationId?: string | null,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

function friendlyMessage(status: number, detail: unknown): string {
  if (status === 400) return 'The selected file is empty or invalid.';
  if (status === 413) return 'The file is larger than the upload limit.';
  if (status === 415) return 'This file type is not supported. Use PDF, PNG, JPG, WEBP, or TIFF.';
  if (status === 409) return 'This item changed or is not ready for that action. Refresh and try again.';
  if (status === 422) return 'Some information needs attention before this can be saved.';
  if (status >= 500) return 'The service could not complete the request. Please try again.';
  if (typeof detail === 'string' && detail.trim()) return detail;
  return 'The request could not be completed.';
}

export function apiUrl(path: string): string {
  if (/^https?:\/\//i.test(path)) return path;
  return `${API_BASE_URL}${path.startsWith('/') ? path : `/${path}`}`;
}

export async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  let response: Response;
  try {
    response = await fetch(apiUrl(path), init);
  } catch (error) {
    throw new ApiError('The application server is unavailable. Check the connection and try again.', 0, error);
  }
  if (!response.ok) {
    let body: unknown;
    try { body = await response.json(); } catch { body = await response.text(); }
    const record = body && typeof body === 'object' ? body as Record<string, unknown> : {};
    const nested = record.error && typeof record.error === 'object' ? record.error as Record<string, unknown> : {};
    const detail = record.detail ?? nested.message ?? body;
    throw new ApiError(friendlyMessage(response.status, detail), response.status, detail, response.headers.get('X-Correlation-ID'));
  }
  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}

export function technicalError(error: unknown): string {
  if (error instanceof ApiError) {
    const suffix = error.correlationId ? ` Correlation ID: ${error.correlationId}` : '';
    const detail = typeof error.technicalDetail === 'string' ? error.technicalDetail : JSON.stringify(error.technicalDetail ?? '');
    return `${error.status || 'network'}: ${detail}${suffix}`;
  }
  return error instanceof Error ? error.message : String(error);
}

export function userError(error: unknown): string {
  return error instanceof ApiError ? error.message : 'Something went wrong. Please try again.';
}
