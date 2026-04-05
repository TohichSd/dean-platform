from pydantic import BaseModel


class GroupStatisticsRead(BaseModel):
    group_id: int
    group_name: str

    is_exam: bool
    assessment_type_name: str

    count_5: int
    count_4: int
    count_3: int
    count_2: int
    absent_count: int

    graded_count: int
    average_score: float | None = None