from pydantic import BaseModel, ConfigDict, Field


class DepartmentBase(BaseModel):
    department_name: str = Field(..., max_length=200)


class DepartmentCreate(DepartmentBase):
    pass


class DepartmentUpdate(BaseModel):
    department_name: str | None = Field(default=None, max_length=200)


class DepartmentRead(DepartmentBase):
    model_config = ConfigDict(from_attributes=True)

    department_id: int