import { apiFetch } from "./client";

export async function getDepartments() {
  return apiFetch("/departments/");
}

export async function createDepartment(payload) {
  return apiFetch("/departments/", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function deleteDepartment(departmentId) {
  return apiFetch(`/departments/${departmentId}`, {
    method: "DELETE",
  });
}