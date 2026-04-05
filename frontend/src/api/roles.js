import { apiFetch } from "./client";

// Получить все роли
export async function getRoles() {
  return apiFetch("/roles/");
}

// Получить одну роль (если понадобится)
export async function getRole(roleId) {
  return apiFetch(`/roles/${roleId}`);
}