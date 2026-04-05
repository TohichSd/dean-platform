from pydantic import BaseModel


class StudentSubjectStatsRead(BaseModel):
    subject_id: int
    subject_name: str
    is_exam: bool
    assessment_type_name: str

    attempts_total: int
    passed_count: int
    failed_count: int
    absent_count: int

    exam_average: float | None = None
    last_result_value: int | None = None
    last_display_value: str
    is_currently_passed: bool