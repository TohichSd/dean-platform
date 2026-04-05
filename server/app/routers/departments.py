from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from server.app.db.database import get_db
from server.app.dependencies.auth import require_admin, require_admin_or_dean
from server.app.db.models import Department
from server.app.schemas.department import (
    DepartmentCreate,
    DepartmentRead,
    DepartmentUpdate,
)

router = APIRouter(prefix="/departments", tags=["Departments"])


@router.get("/", response_model=list[DepartmentRead])
def get_departments(
    db: Session = Depends(get_db),
    current_user=Depends(require_admin_or_dean),
):
    departments = (
        db.query(Department)
        .order_by(Department.department_name.asc())
        .all()
    )
    return departments


@router.get("/{department_id}", response_model=DepartmentRead)
def get_department(
    department_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(require_admin_or_dean),
):
    department = (
        db.query(Department)
        .filter(Department.department_id == department_id)
        .first()
    )

    if not department:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Кафедра не найдена",
        )

    return department


@router.post("/", response_model=DepartmentRead, status_code=status.HTTP_201_CREATED)
def create_department(
    department_data: DepartmentCreate,
    db: Session = Depends(get_db),
    current_user=Depends(require_admin),
):
    existing_department = (
        db.query(Department)
        .filter(Department.department_name == department_data.department_name)
        .first()
    )

    if existing_department:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Кафедра с таким названием уже существует",
        )

    department = Department(
        department_name=department_data.department_name,
    )

    db.add(department)
    db.commit()
    db.refresh(department)

    return department


@router.put("/{department_id}", response_model=DepartmentRead)
def update_department(
    department_id: int,
    department_data: DepartmentUpdate,
    db: Session = Depends(get_db),
    current_user=Depends(require_admin),
):
    department = (
        db.query(Department)
        .filter(Department.department_id == department_id)
        .first()
    )

    if not department:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Кафедра не найдена",
        )

    if department_data.department_name is not None:
        existing_department = (
            db.query(Department)
            .filter(
                Department.department_name == department_data.department_name,
                Department.department_id != department_id,
            )
            .first()
        )

        if existing_department:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Кафедра с таким названием уже существует",
            )

        department.department_name = department_data.department_name

    db.commit()
    db.refresh(department)

    return department


@router.delete("/{department_id}")
def delete_department(
    department_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(require_admin),
):
    department = (
        db.query(Department)
        .filter(Department.department_id == department_id)
        .first()
    )

    if not department:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Кафедра не найдена",
        )

    db.delete(department)
    db.commit()

    return {
        "message": "Кафедра удалена",
        "department_id": department_id,
    }