import { API_BASE } from "./api.js";

const STORAGE_KEY = "cityfashion_admin_auth_v1";

function getStoredToken() {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed?.token || null;
  } catch (err) {
    console.error("Failed to read admin token", err);
    return null;
  }
}

function buildHeaders(token, extra = {}) {
  const headers = { ...extra };
  const resolved = token || getStoredToken();
  if (resolved) {
    headers.Authorization = `Bearer ${resolved}`;
  }
  headers["Content-Type"] = headers["Content-Type"] || "application/json";
  return headers;
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

  return new Error(`Admin API error (${response.status}): ${message || "Unknown error"}`);
}

async function request(method, route, body, token) {
  const url = `${API_BASE}${route}`;
  const options = {
    method,
    headers: buildHeaders(token),
    credentials: "include"
  };

  if (body !== undefined) {
    options.body = typeof body === "string" ? body : JSON.stringify(body);
  }

  const response = await fetch(url, options);
  if (!response.ok) {
    throw await parseError(response);
  }

  if (response.status === 204) return null;
  return response.json();
}

export function adminGet(route, token) {
  return request("GET", route, undefined, token);
}

export function adminPost(route, body, token) {
  return request("POST", route, body, token);
}

export function adminPut(route, body, token) {
  return request("PUT", route, body, token);
}

export function adminDelete(route, token) {
  return request("DELETE", route, undefined, token);
}

export async function uploadProductImage(file, token) {
  const signed = await adminPost("/upload/image", { fileType: file.type }, token);

  const uploadRes = await fetch(signed.uploadUrl, {
    method: "PUT",
    headers: { "Content-Type": file.type },
    body: file
  });

  if (!uploadRes.ok) {
    const text = await uploadRes.text();
    throw new Error(text || "Failed to upload image");
  }

  return signed.imageUrl;
}
