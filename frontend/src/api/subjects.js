import { apiFetch } from "./client";

export async function getSubjects() {
  return apiFetch("/subjects/");
}

export async function createSubject(payload) {
  return apiFetch("/subjects/", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function deleteSubject(subjectId) {
  return apiFetch(`/subjects/${subjectId}`, {
    method: "DELETE",
  });
}