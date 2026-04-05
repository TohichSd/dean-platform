const API_BASE = "/api";

function getToken() {
  return localStorage.getItem("access_token");
}

export async function apiFetch(path, options = {}) {
  const token = getToken();

  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  });

  if (response.status === 401) {
    localStorage.removeItem("access_token");
    window.location.href = "/login";
    throw new Error("Не авторизован");
  }

  if (!response.ok) {
    let detail = "Ошибка запроса";
    try {
      const data = await response.json();
      detail = data.detail || detail;
    } catch {
      //
    }
    throw new Error(detail);
  }

  if (response.status === 204) {
    return null;
  }

  return response.json();
}