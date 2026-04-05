from pydantic import BaseModel, ConfigDict, Field


class SubjectBase(BaseModel):
    subject_name: str = Field(..., max_length=200)


class SubjectCreate(SubjectBase):
    pass


class SubjectUpdate(BaseModel):
    subject_name: str | None = Field(default=None, max_length=200)


class SubjectRead(SubjectBase):
    model_config = ConfigDict(from_attributes=True)

    subject_id: int