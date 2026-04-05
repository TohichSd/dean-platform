import { apiFetch } from "./client";

export async function getGroupStatistics() {
  return apiFetch("/statistics/groups");
}