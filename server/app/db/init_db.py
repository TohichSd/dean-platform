from sqlalchemy.orm import Session

from server.app.core.security import hash_password
from server.app.db.models import Role, User

ROLES = [
    {"role_id": 1, "role_name": "admin"},
    {"role_id": 2, "role_name": "dean"},
    {"role_id": 3, "role_name": "teacher"},
    {"role_id": 4, "role_name": "student"},
]


def init_roles(db: Session):
    for role_data in ROLES:
        existing = db.query(Role).filter(Role.role_id == role_data["role_id"]).first()
        if not existing:
            db.add(
                Role(
                    role_id=role_data["role_id"],
                    role_name=role_data["role_name"],
                )
            )
    db.commit()


def init_admin(db: Session):
    existing_admin = db.query(User).filter(User.login == "admin").first()
    if existing_admin:
        return

    admin_role = db.query(Role).filter(Role.role_name == "admin").first()
    if not admin_role:
        return

    admin_user = User(
        first_name="Системный",
        last_name="Администратор",
        surname=None,
        login="admin",
        password_hash=hash_password("admin"),
        password_salt=None,
        role_id=admin_role.role_id,
    )

    db.add(admin_user)
    db.commit()