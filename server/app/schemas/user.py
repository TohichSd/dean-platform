from pydantic import BaseModel, ConfigDict, Field


class UserBase(BaseModel):
    first_name: str = Field(..., max_length=100)
    last_name: str = Field(..., max_length=100)
    surname: str | None = Field(default=None, max_length=100)
    login: str = Field(..., max_length=100)
    role_id: int


class UserCreate(UserBase):
    password: str = Field(..., min_length=1, max_length=255)
    group_id: int | None = None
    department_id: int | None = None


class UserUpdate(BaseModel):
    first_name: str | None = Field(default=None, max_length=100)
    last_name: str | None = Field(default=None, max_length=100)
    surname: str | None = Field(default=None, max_length=100)
    login: str | None = Field(default=None, max_length=100)
    password: str | None = Field(default=None, min_length=1, max_length=255)
    role_id: int | None = None
    group_id: int | None = None
    department_id: int | None = None


class UserRead(UserBase):
    model_config = ConfigDict(from_attributes=True)

    user_id: int
    role_name: str | None = None
    role_name_ru: str | None = None
    group_id: int | None = None
    department_id: int | None = None