import { apiFetch } from "./client";

export async function deleteAttempt(attemptId) {
  return apiFetch(`/attempts/${attemptId}`, {
    method: "DELETE",
  });
}