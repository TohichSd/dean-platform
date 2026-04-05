from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload

from server.app.core.security import create_access_token, verify_password
from server.app.db.database import get_db
from server.app.dependencies.auth import get_current_user
from server.app.db.models import User, Role
from server.app.schemas.auth import AuthMeResponse, LoginRequest, TokenResponse

router = APIRouter(prefix="/auth", tags=["Auth"])


@router.post("/login", response_model=TokenResponse)
def login(data: LoginRequest, db: Session = Depends(get_db)):
    user = (
        db.query(User)
        .options(joinedload(User.role))
        .filter(User.login == data.login)
        .first()
    )

    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Неверный логин или пароль",
        )

    if not verify_password(data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Неверный логин или пароль",
        )

    access_token = create_access_token(
        {
            "sub": str(user.user_id),
            "login": user.login,
            "role_id": user.role_id,
            "role_name": user.role.role_name,
            "first_name": user.first_name,
            "last_name": user.last_name,
            "surname": user.surname,
        }
    )

    return {
        "access_token": access_token,
        "token_type": "bearer",
    }


@router.get("/me", response_model=AuthMeResponse)
def get_me(current_user=Depends(get_current_user)):
    return current_user


@router.post("/logout")
def logout():
    return {"message": "Выход выполнен успешно"}