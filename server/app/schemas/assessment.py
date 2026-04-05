from datetime import datetime

from pydantic import BaseModel, ConfigDict


class AssessmentCreate(BaseModel):
    group_id: int
    is_exam: bool
    teacher_id: int
    assessment_dt: datetime
    is_retake: bool
    subject_id: int


class AssessmentUpdate(BaseModel):
    group_id: int | None = None
    is_exam: bool | None = None
    teacher_id: int | None = None
    assessment_dt: datetime | None = None
    is_retake: bool | None = None
    subject_id: int | None = None


class AssessmentRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    assessment_id: int
    group_id: int
    is_exam: bool
    teacher_id: int
    assessment_dt: datetime
    is_retake: bool
    subject_id: int

    group_name: str | None = None
    teacher_name: str | None = None
    subject_name: str | None = None


class RetakeOptionRead(BaseModel):
    assessment_id: int
    assessment_dt: str
    subject_name: str
    teacher_name: str | None = None


class AssignRetakeRequest(BaseModel):
    student_id: int