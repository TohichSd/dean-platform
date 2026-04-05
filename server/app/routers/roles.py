from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from server.app.db.database import get_db
from server.app.dependencies.auth import require_admin_or_dean
from server.app.db.models import Role
from server.app.schemas.role import RoleRead

router = APIRouter(prefix="/roles", tags=["Roles"])

ROLE_TRANSLATIONS = {
    "admin": "Администратор",
    "dean": "Деканат",
    "teacher": "Преподаватель",
    "student": "Студент",
}


@router.get("/", response_model=list[RoleRead])
def get_roles(
    db: Session = Depends(get_db),
    current_user=Depends(require_admin_or_dean),
):
    roles = db.query(Role).order_by(Role.role_id.asc()).all()

    return [
        RoleRead(
            role_id=role.role_id,
            role_name=role.role_name,
            role_name_ru=ROLE_TRANSLATIONS.get(role.role_name, role.role_name),
        )
        for role in roles
    ]