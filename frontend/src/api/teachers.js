import { apiFetch } from "./client";

export async function getTeachers() {
  return apiFetch("/teachers/");
}