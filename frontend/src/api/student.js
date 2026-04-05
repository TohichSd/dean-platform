import { apiFetch } from "./client";

export async function getStudentAssessments() {
  return apiFetch("/assessments/");
}

export async function getStudentResults() {
  return apiFetch("/student/results");
}

export async function getStudentStatistics() {
  return apiFetch("/student/statistics");
}