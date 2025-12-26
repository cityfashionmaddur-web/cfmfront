const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:4000";

const STORAGE_KEY = "cityfashion_auth_v1";

function getStoredToken() {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed?.token || null;
  } catch (err) {
    console.error("Failed to read auth token", err);
    return null;
  }
}

async function parseError(response) {
  let text = "";
  try {
    text = await response.text();
  } catch (err) {
    text = `Failed to read error body: ${err.message || err}`;
  }

  let detail;
  try {
    detail = text ? JSON.parse(text) : null;
  } catch {
    detail = text;
  }

  const message =
    (detail && detail.message) ||
    (typeof detail === "string" ? detail : "") ||
    response.statusText;

  return new Error(`API error (${response.status}): ${message || "Unknown error"}`);
}

async function request(path, options = {}) {
  const { method = "GET", body, auth = false, headers = {} } = options;
  const url = path.startsWith("http") ? path : `${API_BASE}${path}`;

  const finalHeaders = {
    Accept: "application/json",
    ...headers
  };

  if (body) {
    finalHeaders["Content-Type"] = "application/json";
  }

  if (auth) {
    const token = getStoredToken();
    if (token) {
      finalHeaders.Authorization = `Bearer ${token}`;
    }
  }

  const response = await fetch(url, {
    method,
    headers: finalHeaders,
    credentials: "include",
    body: body ? JSON.stringify(body) : undefined
  });

  if (!response.ok) {
    throw await parseError(response);
  }

  if (response.status === 204) return null;
  return response.json();
}

export function apiGet(path, options = {}) {
  return request(path, { ...options, method: "GET" });
}

export function apiPost(path, body, options = {}) {
  return request(path, { ...options, method: "POST", body });
}

export function apiPut(path, body, options = {}) {
  return request(path, { ...options, method: "PUT", body });
}

export function apiDelete(path, options = {}) {
  return request(path, { ...options, method: "DELETE" });
}

export { API_BASE };
