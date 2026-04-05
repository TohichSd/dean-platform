from pydantic import BaseModel, ConfigDict


class AttemptBase(BaseModel):
    assessment_id: int
    student_id: int


class AttemptCreate(AttemptBase):
    pass


class AttemptUpdate(BaseModel):
    assessment_id: int | None = None
    student_id: int | None = None


class AttemptRead(AttemptBase):
    model_config = ConfigDict(from_attributes=True)

    attempt_id: int


class AttemptResultUpdate(BaseModel):
    result_value: int | None = None
    is_absent: bool


from pydantic import BaseModel, ConfigDict


class AttemptBase(BaseModel):
    assessment_id: int
    student_id: int


class AttemptCreate(AttemptBase):
    pass


class AttemptUpdate(BaseModel):
    assessment_id: int | None = None
    student_id: int | None = None


class AttemptRead(AttemptBase):
    model_config = ConfigDict(from_attributes=True)

    attempt_id: int


class AttemptResultUpdate(BaseModel):
    result_value: int | None = None
    is_absent: bool


class AssessmentStudentResultRead(BaseModel):
    attempt_id: int
    student_id: int
    student_name: str
    result_id: int | None = None
    result_value: int | None = None
    is_absent: bool
    is_exam: bool
    display_value: str

    can_assign_retake: bool = False
    already_assigned_to_retake: bool = False
    assigned_retake_assessment_id: int | None = None
    assigned_retake_attempt_id: int | None = None
    assigned_retake_display: str | None = None