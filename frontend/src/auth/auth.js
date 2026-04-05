import { apiFetch } from "../api/client";

export function saveToken(token) {
  localStorage.setItem("access_token", token);
}

export function clearToken() {
  localStorage.removeItem("access_token");
}

export function getToken() {
  return localStorage.getItem("access_token");
}

export async function login(loginValue, password) {
  const data = await apiFetch("/auth/login", {
    method: "POST",
    body: JSON.stringify({
      login: loginValue,
      password,
    }),
  });

  saveToken(data.access_token);
  return data;
}

export async function fetchMe() {
  return apiFetch("/auth/me");
}