from collections import defaultdict

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload

from server.app.db.database import get_db
from server.app.dependencies.auth import get_current_user
from server.app.db.models import Attempt, Assessment, Student, Teacher
from server.app.schemas.student_result import StudentResultRead
from server.app.schemas.statistics import StudentSubjectStatsRead

router = APIRouter(prefix="/student", tags=["Student"])


def build_display_value(is_exam: bool, result_value: int | None, is_absent: bool) -> str:
    if is_absent:
        return "Неявка"

    if result_value is None:
        return "—"

    if is_exam:
        return str(result_value)

    return "Зачтено" if result_value > 2 else "Не зачтено"


def is_passed(is_exam: bool, result_value: int | None, is_absent: bool) -> bool:
    if is_absent or result_value is None:
        return False

    if is_exam:
        return result_value >= 3

    return result_value > 2


@router.get("/results", response_model=list[StudentResultRead])
def get_my_results(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    if current_user["role_name"] != "student":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Недостаточно прав",
        )

    student = db.query(Student).filter(Student.user_id == current_user["user_id"]).first()
    if not student:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Студент не найден",
        )

    attempts = (
        db.query(Attempt)
        .options(
            joinedload(Attempt.assessment).joinedload(Assessment.group),
            joinedload(Attempt.assessment).joinedload(Assessment.subject),
            joinedload(Attempt.assessment)
            .joinedload(Assessment.teacher)
            .joinedload(Teacher.user),
            joinedload(Attempt.result),
        )
        .filter(Attempt.student_id == student.student_id)
        .order_by(Attempt.assessment_id.asc(), Attempt.attempt_id.asc())
        .all()
    )

    result = []

    for attempt in attempts:
        assessment = attempt.assessment
        attempt_result = attempt.result

        teacher_name = None
        if assessment.teacher and assessment.teacher.user:
            teacher_name = (
                f"{assessment.teacher.user.last_name} "
                f"{assessment.teacher.user.first_name} "
                f"{assessment.teacher.user.surname or ''}"
            ).strip()

        result_value = attempt_result.result_value if attempt_result else None
        is_absent = attempt_result.is_absent if attempt_result else False

        result.append(
            StudentResultRead(
                assessment_id=assessment.assessment_id,
                subject_name=assessment.subject.subject_name if assessment.subject else None,
                teacher_name=teacher_name,
                group_name=assessment.group.group_name if assessment.group else None,
                assessment_dt=assessment.assessment_dt,
                is_exam=assessment.is_exam,
                is_retake=assessment.is_retake,
                attempt_id=attempt.attempt_id,
                result_id=attempt_result.result_id if attempt_result else None,
                result_value=result_value,
                is_absent=is_absent,
                display_value=build_display_value(
                    assessment.is_exam,
                    result_value,
                    is_absent,
                ),
            )
        )

    return result


@router.get("/statistics", response_model=list[StudentSubjectStatsRead])
def get_my_statistics(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    if current_user["role_name"] != "student":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Недостаточно прав",
        )

    student = db.query(Student).filter(Student.user_id == current_user["user_id"]).first()
    if not student:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Студент не найден",
        )

    attempts = (
        db.query(Attempt)
        .options(
            joinedload(Attempt.assessment).joinedload(Assessment.subject),
            joinedload(Attempt.result),
        )
        .filter(Attempt.student_id == student.student_id)
        .order_by(Attempt.assessment_id.asc(), Attempt.attempt_id.asc())
        .all()
    )

    grouped = defaultdict(list)
    for attempt in attempts:
        if attempt.assessment and attempt.assessment.subject:
            key = (
                attempt.assessment.subject.subject_id,
                attempt.assessment.is_exam,
            )
            grouped[key].append(attempt)

    stats = []

    for (subject_id, is_exam), subject_attempts in grouped.items():
        subject_name = subject_attempts[0].assessment.subject.subject_name
        assessment_type_name = "Экзамен" if is_exam else "Зачёт"

        attempts_total = len(subject_attempts)
        passed_count = 0
        failed_count = 0
        absent_count = 0
        exam_values = []

        sorted_attempts = sorted(
            subject_attempts,
            key=lambda a: a.assessment.assessment_dt
        )
        last_attempt = sorted_attempts[-1]
        last_result = last_attempt.result

        last_result_value = last_result.result_value if last_result else None
        last_is_absent = last_result.is_absent if last_result else False
        last_display_value = build_display_value(
            last_attempt.assessment.is_exam,
            last_result_value,
            last_is_absent,
        )

        for attempt in subject_attempts:
            result = attempt.result
            result_value = result.result_value if result else None
            is_absent_value = result.is_absent if result else False

            if is_absent_value:
                absent_count += 1
            elif result_value is None:
                pass
            elif is_passed(attempt.assessment.is_exam, result_value, is_absent_value):
                passed_count += 1
            else:
                failed_count += 1

            if (
                attempt.assessment.is_exam
                and result_value is not None
                and not is_absent_value
            ):
                exam_values.append(result_value)

        exam_average = None
        if is_exam and exam_values:
            exam_average = round(sum(exam_values) / len(exam_values), 2)

        stats.append(
            StudentSubjectStatsRead(
                subject_id=subject_id,
                subject_name=subject_name,
                is_exam=is_exam,
                assessment_type_name=assessment_type_name,
                attempts_total=attempts_total,
                passed_count=passed_count,
                failed_count=failed_count,
                absent_count=absent_count,
                exam_average=exam_average,
                last_result_value=last_result_value,
                last_display_value=last_display_value,
                is_currently_passed=is_passed(
                    last_attempt.assessment.is_exam,
                    last_result_value,
                    last_is_absent,
                ),
            )
        )

    stats.sort(key=lambda item: (item.subject_name.lower(), not item.is_exam))
    return stats