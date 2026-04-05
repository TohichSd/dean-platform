import { apiFetch } from "./client";

export async function getAssessments() {
  return apiFetch("/assessments/");
}

export async function getAssessment(assessmentId) {
  return apiFetch(`/assessments/${assessmentId}`);
}

export async function createAssessment(payload) {
  return apiFetch("/assessments/", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function deleteAssessment(assessmentId) {
  return apiFetch(`/assessments/${assessmentId}`, {
    method: "DELETE",
  });
}

export async function getAssessmentStudents(assessmentId) {
  return apiFetch(`/assessments/${assessmentId}/students`);
}

export async function updateAttemptResult(attemptId, payload) {
  return apiFetch(`/assessments/attempts/${attemptId}/result`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export async function getRetakeOptions(assessmentId, studentId) {
  return apiFetch(`/assessments/${assessmentId}/retake-options/${studentId}`);
}

export async function assignRetake(retakeAssessmentId, studentId) {
  return apiFetch(`/assessments/${retakeAssessmentId}/assign-retake`, {
    method: "POST",
    body: JSON.stringify({
      student_id: studentId,
    }),
  });
}