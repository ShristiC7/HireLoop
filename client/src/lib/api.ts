/**
 * HireLoop API Client
 *
 * Central HTTP client for all backend API calls.
 * - Automatically attaches Bearer token from in-memory store
 * - Sends cookies for refresh token (credentials: "include")
 * - On 401, silently calls /auth/refresh and retries once
 * - On failed refresh, clears state and redirects to /
 */

// Use relative path (/api/v1) in development — Vite proxies it to localhost:5000
// In production, the env var should point to the deployed API
const BASE_URL =
  import.meta.env.VITE_API_URL ||
  (typeof window !== "undefined" ? "/api/v1" : "http://localhost:5000/api/v1");

// ── In-memory access token store ──────────────────────────────────────────────
// Stored in memory (not localStorage) to protect against XSS
let accessToken: string | null = null;

export const tokenStore = {
  get: () => accessToken,
  set: (t: string | null) => {
    accessToken = t;
  },
};

// ── Request helper ────────────────────────────────────────────────────────────
type RequestOptions = RequestInit & { _isRetry?: boolean };

async function request<T = unknown>(
  endpoint: string,
  options: RequestOptions = {}
): Promise<T> {
  const isFormData = options.body instanceof FormData;

  const headers: Record<string, string> = {
    ...(!isFormData ? { "Content-Type": "application/json" } : {}),
    ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
    ...(options.headers as Record<string, string>),
  };

  const res = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers,
    credentials: "include", // send refresh token cookie
  });

  // Token expired → try silent refresh once
  if (res.status === 401 && !options._isRetry) {
    const refreshed = await silentRefresh();
    if (refreshed) {
      return request<T>(endpoint, { ...options, _isRetry: true });
    }
    tokenStore.set(null);
    // Redirect to login
    if (typeof window !== "undefined") {
      window.location.href = "/";
    }
    return Promise.reject(new Error("Session expired. Please log in again."));
  }

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || `Request failed with status ${res.status}`);
  }
  return data as T;
}

async function silentRefresh(): Promise<boolean> {
  try {
    const res = await fetch(`${BASE_URL}/auth/refresh`, {
      method: "POST",
      credentials: "include",
    });
    if (!res.ok) return false;
    const data = await res.json();
    if (data?.data?.accessToken) {
      tokenStore.set(data.data.accessToken);
      return true;
    }
    return false;
  } catch {
    return false;
  }
}

// ── Public API surface ────────────────────────────────────────────────────────
export const api = {
  get: <T = unknown>(url: string, opts?: RequestOptions) =>
    request<T>(url, { method: "GET", ...opts }),

  post: <T = unknown>(url: string, body?: unknown, opts?: RequestOptions) =>
    request<T>(url, {
      method: "POST",
      body: body instanceof FormData ? body : JSON.stringify(body),
      ...opts,
    }),

  put: <T = unknown>(url: string, body?: unknown, opts?: RequestOptions) =>
    request<T>(url, {
      method: "PUT",
      body: JSON.stringify(body),
      ...opts,
    }),

  patch: <T = unknown>(url: string, body?: unknown, opts?: RequestOptions) =>
    request<T>(url, {
      method: "PATCH",
      body: JSON.stringify(body),
      ...opts,
    }),

  delete: <T = unknown>(url: string, opts?: RequestOptions) =>
    request<T>(url, { method: "DELETE", ...opts }),
};
