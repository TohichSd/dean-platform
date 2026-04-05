from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from server.app.core.security import decode_access_token

security = HTTPBearer()

ROLE_ADMIN = "admin"
ROLE_DEAN = "dean"
ROLE_TEACHER = "teacher"
ROLE_STUDENT = "student"


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
):
    token = credentials.credentials
    payload = decode_access_token(token)

    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Недействительный токен",
        )

    user_id = payload.get("sub")
    login = payload.get("login")
    role_id = payload.get("role_id")
    role_name = payload.get("role_name")
    first_name = payload.get("first_name")
    last_name = payload.get("last_name")
    surname = payload.get("surname")

    if (
        user_id is None
        or login is None
        or role_id is None
        or role_name is None
    ):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Некорректный токен",
        )

    return {
        "user_id": int(user_id),
        "login": login,
        "role_id": int(role_id),
        "role_name": role_name,
        "first_name": first_name,
        "last_name": last_name,
        "surname": surname,
    }


def require_roles(*allowed_roles):
    def checker(current_user=Depends(get_current_user)):
        if current_user["role_name"] not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Недостаточно прав",
            )
        return current_user

    return checker


def require_admin(current_user=Depends(require_roles(ROLE_ADMIN))):
    return current_user


def require_admin_or_dean(
    current_user=Depends(require_roles(ROLE_ADMIN, ROLE_DEAN)),
):
    return current_user