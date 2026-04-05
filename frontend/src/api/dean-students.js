import { apiFetch } from "./client";

export async function getDeanStudents() {
  return apiFetch("/users/");
}

export async function createDeanStudent(payload) {
  return apiFetch("/users/", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function updateDeanStudent(userId, payload) {
  return apiFetch(`/users/${userId}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}