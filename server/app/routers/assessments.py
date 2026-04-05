from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload

from server.app.db.database import get_db
from server.app.dependencies.auth import get_current_user
from server.app.db.models import (
    Assessment,
    Attempt,
    Result,
    Student,
    StudyGroup,
    Subject,
    Teacher,
    User,
)
from server.app.schemas.assessment import (
    AssessmentCreate,
    AssessmentRead,
    AssignRetakeRequest,
    RetakeOptionRead,
)
from server.app.schemas.attempt import (
    AttemptResultUpdate,
    AssessmentStudentResultRead,
)

router = APIRouter(prefix="/assessments", tags=["Assessments"])


def build_display_value(is_exam: bool, result_value: int | None, is_absent: bool) -> str:
    if is_absent:
        return "Неявка"

    if result_value is None:
        return "—"

    if is_exam:
        return str(result_value)

    return "Зачтено" if result_value > 2 else "Не зачтено"


def build_assessment_response(assessment: Assessment) -> dict:
    teacher_name = None
    if assessment.teacher and assessment.teacher.user:
        teacher_name = (
            f"{assessment.teacher.user.last_name} "
            f"{assessment.teacher.user.first_name} "
            f"{assessment.teacher.user.surname or ''}"
        ).strip()

    return {
        "assessment_id": assessment.assessment_id,
        "group_id": assessment.group_id,
        "is_exam": assessment.is_exam,
        "teacher_id": assessment.teacher_id,
        "assessment_dt": assessment.assessment_dt,
        "is_retake": assessment.is_retake,
        "subject_id": assessment.subject_id,
        "group_name": assessment.group.group_name if assessment.group else None,
        "teacher_name": teacher_name,
        "subject_name": assessment.subject.subject_name if assessment.subject else None,
    }


def get_current_teacher(db: Session, user_id: int) -> Teacher | None:
    return db.query(Teacher).filter(Teacher.user_id == user_id).first()


def get_current_student(db: Session, user_id: int) -> Student | None:
    return db.query(Student).filter(Student.user_id == user_id).first()


def ensure_assessment_visible(
    db: Session,
    current_user: dict,
    assessment_id: int,
) -> Assessment:
    assessment = (
        db.query(Assessment)
        .options(
            joinedload(Assessment.group),
            joinedload(Assessment.subject),
            joinedload(Assessment.teacher).joinedload(Teacher.user),
        )
        .filter(Assessment.assessment_id == assessment_id)
        .first()
    )

    if not assessment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Аттестация не найдена",
        )

    role_name = current_user["role_name"]

    if role_name in ("admin", "dean"):
        return assessment

    if role_name == "teacher":
        teacher = get_current_teacher(db, current_user["user_id"])
        if not teacher or teacher.teacher_id != assessment.teacher_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Недостаточно прав",
            )
        return assessment

    if role_name == "student":
        student = get_current_student(db, current_user["user_id"])
        if not student:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Недостаточно прав",
            )

        own_attempt = (
            db.query(Attempt)
            .filter(
                Attempt.assessment_id == assessment_id,
                Attempt.student_id == student.student_id,
            )
            .first()
        )

        if not own_attempt:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Недостаточно прав",
            )

        return assessment

    raise HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail="Недостаточно прав",
    )


def ensure_assessment_manageable(
    db: Session,
    current_user: dict,
    assessment_id: int,
) -> Assessment:
    assessment = ensure_assessment_visible(db, current_user, assessment_id)

    role_name = current_user["role_name"]

    if role_name in ("admin", "dean"):
        return assessment

    if role_name == "teacher":
        teacher = get_current_teacher(db, current_user["user_id"])
        if teacher and teacher.teacher_id == assessment.teacher_id:
            return assessment

    raise HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail="Недостаточно прав",
    )


@router.get("/", response_model=list[AssessmentRead])
def get_assessments(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    role_name = current_user["role_name"]

    query = (
        db.query(Assessment)
        .options(
            joinedload(Assessment.group),
            joinedload(Assessment.subject),
            joinedload(Assessment.teacher).joinedload(Teacher.user),
        )
        .order_by(Assessment.assessment_dt.asc())
    )

    if role_name in ("admin", "dean"):
        assessments = query.all()

    elif role_name == "teacher":
        teacher = get_current_teacher(db, current_user["user_id"])
        if not teacher:
            return []
        assessments = query.filter(Assessment.teacher_id == teacher.teacher_id).all()

    elif role_name == "student":
        student = get_current_student(db, current_user["user_id"])
        if not student:
            return []

        assessments = (
            query.join(Attempt, Attempt.assessment_id == Assessment.assessment_id)
            .filter(Attempt.student_id == student.student_id)
            .all()
        )

    else:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Недостаточно прав",
        )

    return [build_assessment_response(item) for item in assessments]


@router.get("/{assessment_id}", response_model=AssessmentRead)
def get_assessment(
    assessment_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    assessment = ensure_assessment_visible(db, current_user, assessment_id)
    return build_assessment_response(assessment)


@router.post("/", response_model=AssessmentRead, status_code=status.HTTP_201_CREATED)
def create_assessment(
    data: AssessmentCreate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    if current_user["role_name"] not in ("admin", "dean"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Недостаточно прав",
        )

    group = db.query(StudyGroup).filter(StudyGroup.group_id == data.group_id).first()
    if not group:
        raise HTTPException(status_code=400, detail="Группа не найдена")

    teacher = db.query(Teacher).filter(Teacher.teacher_id == data.teacher_id).first()
    if not teacher:
        raise HTTPException(status_code=400, detail="Преподаватель не найден")

    subject = db.query(Subject).filter(Subject.subject_id == data.subject_id).first()
    if not subject:
        raise HTTPException(status_code=400, detail="Предмет не найден")

    assessment = Assessment(
        group_id=data.group_id,
        is_exam=data.is_exam,
        teacher_id=data.teacher_id,
        assessment_dt=data.assessment_dt,
        is_retake=data.is_retake,
        subject_id=data.subject_id,
    )

    db.add(assessment)
    db.flush()

    # Для обычной аттестации попытки создаются всем студентам группы.
    # Для пересдачи попытки добавляются только вручную через направление.
    if not data.is_retake:
        students = db.query(Student).filter(Student.group_id == data.group_id).all()

        for student in students:
            db.add(
                Attempt(
                    assessment_id=assessment.assessment_id,
                    student_id=student.student_id,
                )
            )

    db.commit()
    db.refresh(assessment)

    assessment = (
        db.query(Assessment)
        .options(
            joinedload(Assessment.group),
            joinedload(Assessment.subject),
            joinedload(Assessment.teacher).joinedload(Teacher.user),
        )
        .filter(Assessment.assessment_id == assessment.assessment_id)
        .first()
    )

    return build_assessment_response(assessment)


@router.delete("/{assessment_id}")
def delete_assessment(
    assessment_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    if current_user["role_name"] not in ("admin", "dean"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Недостаточно прав",
        )

    assessment = (
        db.query(Assessment)
        .options(joinedload(Assessment.attempts).joinedload(Attempt.result))
        .filter(Assessment.assessment_id == assessment_id)
        .first()
    )

    if not assessment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Аттестация не найдена",
        )

    for attempt in assessment.attempts:
        if attempt.result:
            db.delete(attempt.result)
        db.delete(attempt)

    db.delete(assessment)
    db.commit()

    return {
        "message": "Аттестация удалена",
        "assessment_id": assessment_id,
    }


@router.get(
    "/{assessment_id}/students",
    response_model=list[AssessmentStudentResultRead],
)
def get_assessment_students(
    assessment_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    assessment = ensure_assessment_visible(db, current_user, assessment_id)

    # student не должен видеть список всех студентов на аттестации
    if current_user["role_name"] == "student":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Недостаточно прав",
        )

    attempts = (
        db.query(Attempt)
        .options(
            joinedload(Attempt.student).joinedload(Student.user),
            joinedload(Attempt.result),
        )
        .filter(Attempt.assessment_id == assessment_id)
        .order_by(Attempt.attempt_id.asc())
        .all()
    )

    response = []

    for attempt in attempts:
        student_user = attempt.student.user
        student_name = (
            f"{student_user.last_name} "
            f"{student_user.first_name} "
            f"{student_user.surname or ''}"
        ).strip()

        result = attempt.result
        result_value = result.result_value if result else None
        is_absent = result.is_absent if result else False

        bad_result = is_absent or result_value == 2

        already_assigned_to_retake = False
        assigned_retake_assessment_id = None
        assigned_retake_attempt_id = None
        assigned_retake_display = None

        if bad_result:
            assigned_retake_attempt = (
                db.query(Attempt)
                .join(Assessment, Attempt.assessment_id == Assessment.assessment_id)
                .options(
                    joinedload(Attempt.assessment).joinedload(Assessment.subject),
                    joinedload(Attempt.assessment)
                    .joinedload(Assessment.teacher)
                    .joinedload(Teacher.user),
                )
                .filter(
                    Attempt.student_id == attempt.student_id,
                    Assessment.subject_id == assessment.subject_id,
                    Assessment.group_id == attempt.student.group_id,
                    Assessment.is_exam == assessment.is_exam,
                    Assessment.is_retake == True,
                    Assessment.assessment_id != assessment.assessment_id,
                )
                .order_by(Assessment.assessment_dt.asc())
                .first()
            )

            if assigned_retake_attempt:
                already_assigned_to_retake = True
                assigned_retake_assessment_id = assigned_retake_attempt.assessment.assessment_id
                assigned_retake_attempt_id = assigned_retake_attempt.attempt_id

                retake_teacher_name = None
                if (
                    assigned_retake_attempt.assessment.teacher
                    and assigned_retake_attempt.assessment.teacher.user
                ):
                    retake_teacher_name = (
                        f"{assigned_retake_attempt.assessment.teacher.user.last_name} "
                        f"{assigned_retake_attempt.assessment.teacher.user.first_name} "
                        f"{assigned_retake_attempt.assessment.teacher.user.surname or ''}"
                    ).strip()

                assigned_retake_display = (
                    f"{assigned_retake_attempt.assessment.assessment_dt.strftime('%d.%m.%Y %H:%M')}"
                )

                if retake_teacher_name:
                    assigned_retake_display += f" — {retake_teacher_name}"

        can_assign_retake = (
            current_user["role_name"] in ("admin", "dean")
            and bad_result
            and not already_assigned_to_retake
        )

        response.append(
            {
                "attempt_id": attempt.attempt_id,
                "student_id": attempt.student_id,
                "student_name": student_name,
                "result_id": result.result_id if result else None,
                "result_value": result_value,
                "is_absent": is_absent,
                "is_exam": assessment.is_exam,
                "display_value": build_display_value(
                    assessment.is_exam,
                    result_value,
                    is_absent,
                ),
                "can_assign_retake": can_assign_retake,
                "already_assigned_to_retake": already_assigned_to_retake,
                "assigned_retake_assessment_id": assigned_retake_assessment_id,
                "assigned_retake_attempt_id": assigned_retake_attempt_id,
                "assigned_retake_display": assigned_retake_display,
            }
        )

    return response


@router.put(
    "/attempts/{attempt_id}/result",
    response_model=AssessmentStudentResultRead,
)
def update_attempt_result(
    attempt_id: int,
    data: AttemptResultUpdate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    attempt = (
        db.query(Attempt)
        .options(
            joinedload(Attempt.student).joinedload(Student.user),
            joinedload(Attempt.assessment),
            joinedload(Attempt.result),
        )
        .filter(Attempt.attempt_id == attempt_id)
        .first()
    )

    if not attempt:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Попытка не найдена",
        )

    # admin/dean — всегда можно
    # teacher — только если это его аттестация
    # student — нельзя
    if current_user["role_name"] in ("admin", "dean"):
        pass
    elif current_user["role_name"] == "teacher":
        teacher = get_current_teacher(db, current_user["user_id"])
        if not teacher or teacher.teacher_id != attempt.assessment.teacher_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Недостаточно прав",
            )
    else:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Недостаточно прав",
        )

    value = None if data.is_absent else data.result_value

    if attempt.result:
        attempt.result.result_value = value
        attempt.result.is_absent = data.is_absent
    else:
        db.add(
            Result(
                attempt_id=attempt_id,
                result_value=value,
                is_absent=data.is_absent,
            )
        )

    db.commit()

    attempt = (
        db.query(Attempt)
        .options(
            joinedload(Attempt.student).joinedload(Student.user),
            joinedload(Attempt.assessment),
            joinedload(Attempt.result),
        )
        .filter(Attempt.attempt_id == attempt_id)
        .first()
    )

    student_user = attempt.student.user
    student_name = (
        f"{student_user.last_name} "
        f"{student_user.first_name} "
        f"{student_user.surname or ''}"
    ).strip()

    attempt_result = attempt.result
    result_value = attempt_result.result_value if attempt_result else None
    is_absent = attempt_result.is_absent if attempt_result else False

    return {
        "attempt_id": attempt.attempt_id,
        "student_id": attempt.student_id,
        "student_name": student_name,
        "result_id": attempt_result.result_id if attempt_result else None,
        "result_value": result_value,
        "is_absent": is_absent,
        "is_exam": attempt.assessment.is_exam,
        "display_value": build_display_value(
            attempt.assessment.is_exam,
            result_value,
            is_absent,
        ),
        "can_assign_retake": False,
        "already_assigned_to_retake": False,
        "assigned_retake_assessment_id": None,
        "assigned_retake_attempt_id": None,
        "assigned_retake_display": None,
    }


@router.get(
    "/{assessment_id}/retake-options/{student_id}",
    response_model=list[RetakeOptionRead],
)
def get_retake_options(
    assessment_id: int,
    student_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    if current_user["role_name"] not in ("admin", "dean"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Недостаточно прав",
        )

    assessment = (
        db.query(Assessment)
        .options(
            joinedload(Assessment.subject),
            joinedload(Assessment.teacher).joinedload(Teacher.user),
        )
        .filter(Assessment.assessment_id == assessment_id)
        .first()
    )

    if not assessment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Аттестация не найдена",
        )

    student = db.query(Student).filter(Student.student_id == student_id).first()

    if not student:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Студент не найден",
        )

    # Со страницы обычной аттестации можно направить только один раз
    if not assessment.is_retake:
        existing_retake_attempt = (
            db.query(Attempt)
            .join(Assessment, Attempt.assessment_id == Assessment.assessment_id)
            .filter(
                Attempt.student_id == student_id,
                Assessment.subject_id == assessment.subject_id,
                Assessment.is_exam == assessment.is_exam,
                Assessment.is_retake == True,
            )
            .first()
        )

        if existing_retake_attempt:
            return []

    now = datetime.now()

    retakes = (
        db.query(Assessment)
        .options(
            joinedload(Assessment.subject),
            joinedload(Assessment.teacher).joinedload(Teacher.user),
        )
        .filter(
            Assessment.subject_id == assessment.subject_id,
            Assessment.group_id == student.group_id,
            Assessment.is_exam == assessment.is_exam,
            Assessment.is_retake == True,
            Assessment.assessment_dt > now,
        )
        .order_by(Assessment.assessment_dt.asc())
        .all()
    )

    result = []

    for retake in retakes:
        if retake.assessment_id == assessment.assessment_id:
            continue

        existing_attempt = (
            db.query(Attempt)
            .options(joinedload(Attempt.result))
            .filter(
                Attempt.assessment_id == retake.assessment_id,
                Attempt.student_id == student_id,
            )
            .first()
        )

        if existing_attempt and existing_attempt.result is not None:
            continue

        teacher_name = None
        if retake.teacher and retake.teacher.user:
            teacher_name = (
                f"{retake.teacher.user.last_name} "
                f"{retake.teacher.user.first_name} "
                f"{retake.teacher.user.surname or ''}"
            ).strip()

        result.append(
            RetakeOptionRead(
                assessment_id=retake.assessment_id,
                assessment_dt=retake.assessment_dt.isoformat(),
                subject_name=retake.subject.subject_name if retake.subject else "",
                teacher_name=teacher_name,
            )
        )

    return result


@router.post("/{retake_assessment_id}/assign-retake")
def assign_retake(
    retake_assessment_id: int,
    data: AssignRetakeRequest,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    if current_user["role_name"] not in ("admin", "dean"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Недостаточно прав",
        )

    retake_assessment = (
        db.query(Assessment)
        .filter(Assessment.assessment_id == retake_assessment_id)
        .first()
    )

    if not retake_assessment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Пересдача не найдена",
        )

    if not retake_assessment.is_retake:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Выбранная аттестация не является пересдачей",
        )

    student = db.query(Student).filter(Student.student_id == data.student_id).first()
    if not student:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Студент не найден",
        )

    existing_attempt = (
        db.query(Attempt)
        .filter(
            Attempt.assessment_id == retake_assessment_id,
            Attempt.student_id == data.student_id,
        )
        .first()
    )

    if existing_attempt:
        return {
            "message": "Студент уже направлен на эту пересдачу",
            "attempt_id": existing_attempt.attempt_id,
            "assessment_id": retake_assessment_id,
            "student_id": data.student_id,
        }

    attempt = Attempt(
        assessment_id=retake_assessment_id,
        student_id=data.student_id,
    )

    db.add(attempt)
    db.commit()
    db.refresh(attempt)

    return {
        "message": "Студент направлен на пересдачу",
        "attempt_id": attempt.attempt_id,
        "assessment_id": retake_assessment_id,
        "student_id": data.student_id,
    }