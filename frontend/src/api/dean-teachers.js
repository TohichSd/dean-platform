import { apiFetch } from "./client";

export async function getDeanTeachers() {
  return apiFetch("/users/");
}

export async function createDeanTeacher(payload) {
  return apiFetch("/users/", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function updateDeanTeacher(userId, payload) {
  return apiFetch(`/users/${userId}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}