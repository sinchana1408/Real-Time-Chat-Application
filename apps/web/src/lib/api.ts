import { ApiResponse } from '@pulsechat/shared';

const BASE_URL = '/api';

export class ApiError extends Error {
  errors?: Record<string, string[]>;
  constructor(message: string, errors?: Record<string, string[]>) {
    super(message);
    this.name = 'ApiError';
    this.errors = errors;
  }
}

export async function apiRequest<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

  const headers = new Headers(options.headers || {});
  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  const res = await fetch(url, {
    ...options,
    headers,
    credentials: 'include', // Includes HTTP-only cookies
  });

  const json: ApiResponse<T> = await res.json().catch(() => ({
    success: false,
    message: 'An unexpected response was received from the server',
  }));

  if (!res.ok || !json.success) {
    throw new ApiError(json.message || json.error || 'Request failed', json.errors);
  }

  return json.data as T;
}
