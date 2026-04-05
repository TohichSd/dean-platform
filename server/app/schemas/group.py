from pydantic import BaseModel, ConfigDict, Field


class GroupBase(BaseModel):
    group_name: str = Field(..., max_length=50)


class GroupCreate(GroupBase):
    pass


class GroupUpdate(BaseModel):
    group_name: str | None = Field(default=None, max_length=50)


class GroupRead(GroupBase):
    model_config = ConfigDict(from_attributes=True)

    group_id: int