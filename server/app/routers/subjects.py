from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from server.app.db.database import get_db
from server.app.dependencies.auth import require_admin_or_dean
from server.app.db.models import Subject
from server.app.schemas.subject import SubjectCreate, SubjectRead, SubjectUpdate

router = APIRouter(prefix="/subjects", tags=["Subjects"])


@router.get("/", response_model=list[SubjectRead])
def get_subjects(
    db: Session = Depends(get_db),
    current_user=Depends(require_admin_or_dean),
):
    return db.query(Subject).order_by(Subject.subject_name.asc()).all()


@router.get("/{subject_id}", response_model=SubjectRead)
def get_subject(
    subject_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(require_admin_or_dean),
):
    subject = db.query(Subject).filter(Subject.subject_id == subject_id).first()

    if not subject:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Предмет не найден",
        )

    return subject


@router.post("/", response_model=SubjectRead, status_code=status.HTTP_201_CREATED)
def create_subject(
    subject_data: SubjectCreate,
    db: Session = Depends(get_db),
    current_user=Depends(require_admin_or_dean),
):
    existing_subject = (
        db.query(Subject)
        .filter(Subject.subject_name == subject_data.subject_name)
        .first()
    )

    if existing_subject:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Предмет с таким названием уже существует",
        )

    subject = Subject(subject_name=subject_data.subject_name)

    db.add(subject)
    db.commit()
    db.refresh(subject)

    return subject


@router.put("/{subject_id}", response_model=SubjectRead)
def update_subject(
    subject_id: int,
    subject_data: SubjectUpdate,
    db: Session = Depends(get_db),
    current_user=Depends(require_admin_or_dean),
):
    subject = db.query(Subject).filter(Subject.subject_id == subject_id).first()

    if not subject:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Предмет не найден",
        )

    if subject_data.subject_name is not None:
        existing_subject = (
            db.query(Subject)
            .filter(
                Subject.subject_name == subject_data.subject_name,
                Subject.subject_id != subject_id,
            )
            .first()
        )

        if existing_subject:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Предмет с таким названием уже существует",
            )

        subject.subject_name = subject_data.subject_name

    db.commit()
    db.refresh(subject)

    return subject


@router.delete("/{subject_id}")
def delete_subject(
    subject_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(require_admin_or_dean),
):
    subject = db.query(Subject).filter(Subject.subject_id == subject_id).first()

    if not subject:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Предмет не найден",
        )

    db.delete(subject)
    db.commit()

    return {
        "message": "Предмет удалён",
        "subject_id": subject_id,
    }