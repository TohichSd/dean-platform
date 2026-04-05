from datetime import datetime
from pydantic import BaseModel


class StudentResultRead(BaseModel):
    assessment_id: int
    subject_name: str | None = None
    teacher_name: str | None = None
    group_name: str | None = None
    assessment_dt: datetime
    is_exam: bool
    is_retake: bool

    attempt_id: int
    result_id: int | None = None
    result_value: int | None = None
    is_absent: bool
    display_value: str