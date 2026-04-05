from pydantic import BaseModel


class TeacherOptionRead(BaseModel):
    teacher_id: int
    full_name: str