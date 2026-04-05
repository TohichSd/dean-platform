from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from server.app.db.database import get_db
from server.app.dependencies.auth import require_admin_or_dean
from server.app.db.models import StudyGroup
from server.app.schemas.group import GroupCreate, GroupRead, GroupUpdate

router = APIRouter(prefix="/groups", tags=["Groups"])


@router.get("/", response_model=list[GroupRead])
def get_groups(
    db: Session = Depends(get_db),
    current_user=Depends(require_admin_or_dean),
):
    groups = db.query(StudyGroup).order_by(StudyGroup.group_name.asc()).all()
    return groups


@router.get("/{group_id}", response_model=GroupRead)
def get_group(
    group_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(require_admin_or_dean),
):
    group = db.query(StudyGroup).filter(StudyGroup.group_id == group_id).first()

    if not group:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Группа не найдена",
        )

    return group


@router.post("/", response_model=GroupRead, status_code=status.HTTP_201_CREATED)
def create_group(
    group_data: GroupCreate,
    db: Session = Depends(get_db),
    current_user=Depends(require_admin_or_dean),
):
    existing_group = (
        db.query(StudyGroup)
        .filter(StudyGroup.group_name == group_data.group_name)
        .first()
    )

    if existing_group:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Группа с таким названием уже существует",
        )

    group = StudyGroup(group_name=group_data.group_name)

    db.add(group)
    db.commit()
    db.refresh(group)

    return group


@router.put("/{group_id}", response_model=GroupRead)
def update_group(
    group_id: int,
    group_data: GroupUpdate,
    db: Session = Depends(get_db),
    current_user=Depends(require_admin_or_dean),
):
    group = db.query(StudyGroup).filter(StudyGroup.group_id == group_id).first()

    if not group:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Группа не найдена",
        )

    if group_data.group_name is not None:
        existing_group = (
            db.query(StudyGroup)
            .filter(
                StudyGroup.group_name == group_data.group_name,
                StudyGroup.group_id != group_id,
            )
            .first()
        )

        if existing_group:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Группа с таким названием уже существует",
            )

        group.group_name = group_data.group_name

    db.commit()
    db.refresh(group)

    return group


@router.delete("/{group_id}")
def delete_group(
    group_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(require_admin_or_dean),
):
    group = db.query(StudyGroup).filter(StudyGroup.group_id == group_id).first()

    if not group:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Группа не найдена",
        )

    db.delete(group)
    db.commit()

    return {
        "message": "Группа удалена",
        "group_id": group_id,
    }