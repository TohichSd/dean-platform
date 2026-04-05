import { apiFetch } from "./client";

export async function getUsers() {
  return apiFetch("/users/");
}

export async function createUser(payload) {
  return apiFetch("/users/", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function updateUser(userId, payload) {
  return apiFetch(`/users/${userId}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export async function deleteUser(userId) {
  return apiFetch(`/users/${userId}`, {
    method: "DELETE",
  });
}