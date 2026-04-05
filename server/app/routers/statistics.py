from collections import defaultdict

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload

from server.app.db.database import get_db
from server.app.dependencies.auth import get_current_user
from server.app.db.models import Attempt, Assessment, StudyGroup, Student
from server.app.schemas.group_statistics import GroupStatisticsRead

router = APIRouter(prefix="/statistics", tags=["Statistics"])


@router.get("/groups", response_model=list[GroupStatisticsRead])
def get_group_statistics(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    if current_user["role_name"] not in ("admin", "dean"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Недостаточно прав",
        )

    attempts = (
        db.query(Attempt)
        .options(
            joinedload(Attempt.student).joinedload(Student.group),
            joinedload(Attempt.assessment).joinedload(Assessment.group),
            joinedload(Attempt.assessment).joinedload(Assessment.subject),
            joinedload(Attempt.result),
        )
        .all()
    )

    # Берём только попытки с результатом
    attempts_with_results = [
        attempt
        for attempt in attempts
        if attempt.result is not None and attempt.assessment is not None and attempt.student is not None
    ]

    # Ключ итоговой записи:
    # группа + студент + предмет + тип аттестации
    final_attempts_map = {}

    for attempt in attempts_with_results:
        assessment = attempt.assessment
        student = attempt.student
        result = attempt.result

        if assessment.subject_id is None:
            continue

        key = (
            student.group_id,
            student.student_id,
            assessment.subject_id,
            assessment.is_exam,
        )

        existing = final_attempts_map.get(key)

        if existing is None:
            final_attempts_map[key] = attempt
            continue

        existing_dt = existing.assessment.assessment_dt
        current_dt = assessment.assessment_dt

        if current_dt > existing_dt:
            final_attempts_map[key] = attempt
        elif current_dt == existing_dt and attempt.attempt_id > existing.attempt_id:
            final_attempts_map[key] = attempt

    grouped_stats = defaultdict(list)

    for attempt in final_attempts_map.values():
        group = attempt.assessment.group
        grouped_stats[(group.group_id, attempt.assessment.is_exam)].append(attempt)

    result_rows = []

    for (group_id, is_exam), final_attempts in grouped_stats.items():
        group_name = final_attempts[0].assessment.group.group_name
        assessment_type_name = "Экзамен" if is_exam else "Зачёт"

        count_5 = 0
        count_4 = 0
        count_3 = 0
        count_2 = 0
        absent_count = 0
        grades_for_average = []

        for attempt in final_attempts:
            result = attempt.result

            if result.is_absent:
                absent_count += 1
                continue

            if result.result_value == 5:
                count_5 += 1
                grades_for_average.append(5)
            elif result.result_value == 4:
                count_4 += 1
                grades_for_average.append(4)
            elif result.result_value == 3:
                count_3 += 1
                grades_for_average.append(3)
            elif result.result_value == 2:
                count_2 += 1
                grades_for_average.append(2)

        average_score = None
        if grades_for_average:
            average_score = round(sum(grades_for_average) / len(grades_for_average), 2)

        result_rows.append(
            GroupStatisticsRead(
                group_id=group_id,
                group_name=group_name,
                is_exam=is_exam,
                assessment_type_name=assessment_type_name,
                count_5=count_5,
                count_4=count_4,
                count_3=count_3,
                count_2=count_2,
                absent_count=absent_count,
                graded_count=len(grades_for_average),
                average_score=average_score,
            )
        )

    result_rows.sort(key=lambda item: (item.group_name.lower(), not item.is_exam))
    return result_rows