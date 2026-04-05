import { apiFetch } from "./client";

export async function getGroups() {
  return apiFetch("/groups/");
}

export async function createGroup(payload) {
  return apiFetch("/groups/", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function deleteGroup(groupId) {
  return apiFetch(`/groups/${groupId}`, {
    method: "DELETE",
  });
}