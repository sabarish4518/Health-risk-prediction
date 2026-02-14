import { API_BASE_URL } from "./config";
import { getStoredUser } from "./authStorage";

async function request(path, options = {}, timeoutMs = 10000) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      signal: controller.signal,
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      const error = new Error(data.message || "Request failed");
      error.status = res.status;
      throw error;
    }
    return data;
  } finally {
    clearTimeout(timeout);
  }
}

export function postPublic(path, body) {
  return request(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

export function getAuth(path) {
  const token = getStoredUser()?.token;
  return request(path, {
    headers: { Authorization: `Bearer ${token}` },
  });
}

export function postAuth(path, body) {
  const token = getStoredUser()?.token;
  return request(path, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  });
}

export function deleteAuth(path) {
  const token = getStoredUser()?.token;
  return request(path, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });
}

