import type { StateResponse } from '@shared/types';
import { visitorId } from './visitor';

export const API_URL = (import.meta.env.VITE_API_URL ?? 'http://localhost:4000').replace(/\/$/, '');

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${API_URL}${path}`, {
      ...init,
      headers: { 'Content-Type': 'application/json', ...(init?.headers ?? {}) },
    });
  } catch (e) {
    if ((e as Error).name === 'AbortError') throw e;
    throw new ApiError(0, "Couldn't reach the live server. Check your connection and try again.");
  }
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new ApiError(res.status, body.error ?? `Request failed (${res.status})`);
  return body as T;
}

export function fetchState(signal?: AbortSignal) {
  return request<StateResponse>(`/api/state?visitorId=${visitorId()}`, { signal });
}

/** Public write: always carries the visitorId. */
export function post<T = { ok: true }>(path: string, body: Record<string, unknown>) {
  return request<T>(`/api${path}`, { method: 'POST', body: JSON.stringify({ visitorId: visitorId(), ...body }) });
}

export function adminRequest<T = unknown>(key: string, path: string, body?: unknown) {
  return request<T>(`/api/admin${path}`, {
    method: body === undefined ? 'GET' : 'POST',
    headers: { 'x-admin-key': key },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
}
