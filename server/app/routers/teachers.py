from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session, joinedload

from server.app.db.database import get_db
from server.app.db.models import Teacher, User
from server.app.schemas.teacher import TeacherOptionRead

router = APIRouter(prefix="/teachers", tags=["Teachers"])


@router.get("/", response_model=list[TeacherOptionRead])
def get_teachers(db: Session = Depends(get_db)):
    teachers = (
        db.query(Teacher)
        .options(joinedload(Teacher.user))
        .order_by(Teacher.teacher_id.asc())
        .all()
    )

    result = []
    for teacher in teachers:
        user = teacher.user
        full_name = (
            f"{user.last_name} {user.first_name} {user.surname or ''}"
        ).strip()

        result.append(
            TeacherOptionRead(
                teacher_id=teacher.teacher_id,
                full_name=full_name,
            )
        )

    return result