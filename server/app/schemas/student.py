from pydantic import BaseModel, ConfigDict


class StudentBase(BaseModel):
    group_id: int
    user_id: int


class StudentCreate(StudentBase):
    pass


class StudentUpdate(BaseModel):
    group_id: int | None = None
    user_id: int | None = None


class StudentRead(StudentBase):
    model_config = ConfigDict(from_attributes=True)

    student_id: int