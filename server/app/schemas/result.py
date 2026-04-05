from pydantic import BaseModel, ConfigDict, field_validator, model_validator


class ResultBase(BaseModel):
    result_value: int | None = None
    attempt_id: int
    is_absent: bool

    @field_validator("result_value")
    @classmethod
    def validate_result_value(cls, value: int | None) -> int | None:
        if value is not None and not (2 <= value <= 5):
            raise ValueError("result_value must be between 2 and 5")
        return value

    @model_validator(mode="after")
    def validate_absent_and_result(self):
        if self.is_absent and self.result_value is not None:
            raise ValueError("If is_absent=True, result_value must be null")
        return self


class ResultCreate(ResultBase):
    pass


class ResultUpdate(BaseModel):
    result_value: int | None = None
    attempt_id: int | None = None
    is_absent: bool | None = None

    @field_validator("result_value")
    @classmethod
    def validate_result_value(cls, value: int | None) -> int | None:
        if value is not None and not (2 <= value <= 5):
            raise ValueError("result_value must be between 2 and 5")
        return value


class ResultRead(ResultBase):
    model_config = ConfigDict(from_attributes=True)

    result_id: int