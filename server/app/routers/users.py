from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload

from server.app.db.database import get_db
from server.app.dependencies.auth import get_current_user
from server.app.db.models import Assessment, Attempt, Role, Student, Teacher, User
from server.app.schemas.user import UserCreate, UserRead, UserUpdate
from server.app.core.security import hash_password

router = APIRouter(prefix="/users", tags=["Users"])


def build_user_response(user: User) -> dict:
    return {
        "user_id": user.user_id,
        "first_name": user.first_name,
        "last_name": user.last_name,
        "surname": user.surname,
        "login": user.login,
        "role_id": user.role_id,
        "role_name": user.role.role_name if user.role else None,
        "group_id": user.student.group_id if user.student else None,
        "department_id": user.teacher.department_id if user.teacher else None,
    }


def get_role_by_id(db: Session, role_id: int) -> Role | None:
    return db.query(Role).filter(Role.role_id == role_id).first()


def is_teacher_or_student_role(role_name: str | None) -> bool:
    return role_name in ("teacher", "student")


def get_current_teacher(db: Session, user_id: int) -> Teacher | None:
    return db.query(Teacher).filter(Teacher.user_id == user_id).first()


def teacher_can_see_student(db: Session, teacher_user_id: int, student_user_id: int) -> bool:
    teacher = db.query(Teacher).filter(Teacher.user_id == teacher_user_id).first()
    student = db.query(Student).filter(Student.user_id == student_user_id).first()

    if not teacher or not student:
        return False

    attempt = (
        db.query(Attempt)
        .join(Assessment, Attempt.assessment_id == Assessment.assessment_id)
        .filter(
            Attempt.student_id == student.student_id,
            Assessment.teacher_id == teacher.teacher_id,
        )
        .first()
    )

    return attempt is not None


@router.get("/", response_model=list[UserRead])
def get_users(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    role_name = current_user["role_name"]

    query = (
        db.query(User)
        .options(
            joinedload(User.role),
            joinedload(User.student),
            joinedload(User.teacher),
        )
        .order_by(User.user_id.asc())
    )

    if role_name == "admin":
        users = query.all()

    elif role_name == "dean":
        users = (
            query.join(Role, User.role_id == Role.role_id)
            .filter(Role.role_name.in_(["student", "teacher"]))
            .all()
        )

    elif role_name == "teacher":
        teacher = get_current_teacher(db, current_user["user_id"])
        if not teacher:
            return []

        users = (
            query.join(Student, Student.user_id == User.user_id)
            .join(Attempt, Attempt.student_id == Student.student_id)
            .join(Assessment, Attempt.assessment_id == Assessment.assessment_id)
            .join(Role, User.role_id == Role.role_id)
            .filter(
                Assessment.teacher_id == teacher.teacher_id,
                Role.role_name == "student",
            )
            .distinct()
            .all()
        )

    else:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Недостаточно прав",
        )

    return [build_user_response(user) for user in users]


@router.get("/{user_id}", response_model=UserRead)
def get_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    user = (
        db.query(User)
        .options(
            joinedload(User.role),
            joinedload(User.student),
            joinedload(User.teacher),
        )
        .filter(User.user_id == user_id)
        .first()
    )

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Пользователь не найден",
        )

    role_name = current_user["role_name"]
    target_role_name = user.role.role_name if user.role else None

    if role_name == "admin":
        return build_user_response(user)

    if role_name == "dean":
        if not is_teacher_or_student_role(target_role_name):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Недостаточно прав",
            )
        return build_user_response(user)

    if role_name == "teacher":
        if target_role_name != "student":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Недостаточно прав",
            )

        if not teacher_can_see_student(db, current_user["user_id"], user_id):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Недостаточно прав",
            )

        return build_user_response(user)

    raise HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail="Недостаточно прав",
    )


@router.post("/", response_model=UserRead, status_code=status.HTTP_201_CREATED)
def create_user(
    user_data: UserCreate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    print(user_data)
    creator_role = current_user["role_name"]

    role = get_role_by_id(db, user_data.role_id)
    if not role:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Роль не найдена",
        )

    # admin может всё, dean только student/teacher
    if creator_role == "admin":
        pass
    elif creator_role == "dean":
        if role.role_name not in ("student", "teacher"):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Недостаточно прав",
            )
    else:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Недостаточно прав",
        )

    existing_user = db.query(User).filter(User.login == user_data.login).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Пользователь с таким логином уже существует",
        )

    user = User(
        first_name=user_data.first_name,
        last_name=user_data.last_name,
        surname=user_data.surname,
        login=user_data.login,
        password_hash=hash_password(user_data.password),
        password_salt=None,
        role_id=user_data.role_id,
    )

    db.add(user)
    db.flush()

    if role.role_name == "student":
        if user_data.group_id is None:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Для студента необходимо указать группу",
            )
        db.add(Student(user_id=user.user_id, group_id=user_data.group_id))

    elif role.role_name == "teacher":
        if user_data.department_id is None:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Для преподавателя необходимо указать кафедру",
            )
        db.add(Teacher(user_id=user.user_id, department_id=user_data.department_id))

    db.commit()
    db.refresh(user)

    user = (
        db.query(User)
        .options(
            joinedload(User.role),
            joinedload(User.student),
            joinedload(User.teacher),
        )
        .filter(User.user_id == user.user_id)
        .first()
    )

    return build_user_response(user)


@router.put("/{user_id}", response_model=UserRead)
def update_user(
    user_id: int,
    user_data: UserUpdate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    user = (
        db.query(User)
        .options(
            joinedload(User.role),
            joinedload(User.student),
            joinedload(User.teacher),
        )
        .filter(User.user_id == user_id)
        .first()
    )

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Пользователь не найден",
        )

    current_role_name = current_user["role_name"]
    target_role_name = user.role.role_name if user.role else None

    if current_role_name == "admin":
        pass
    elif current_role_name == "dean":
        if not is_teacher_or_student_role(target_role_name):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Недостаточно прав",
            )
    else:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Недостаточно прав",
        )

    if user_data.role_id is not None:
        new_role = get_role_by_id(db, user_data.role_id)
        if not new_role:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Роль не найдена",
            )

        if current_role_name == "dean" and new_role.role_name not in ("student", "teacher"):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Недостаточно прав",
            )
    else:
        new_role = user.role

    if user_data.login is not None and user_data.login != user.login:
        existing_user = db.query(User).filter(User.login == user_data.login).first()
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Пользователь с таким логином уже существует",
            )
        user.login = user_data.login

    if user_data.first_name is not None:
        user.first_name = user_data.first_name
    if user_data.last_name is not None:
        user.last_name = user_data.last_name
    if user_data.surname is not None:
        user.surname = user_data.surname
    if user_data.password is not None:
        user.password_hash = hash_password(user_data.password)

    if user_data.role_id is not None and user_data.role_id != user.role_id:
        if user.student:
            db.delete(user.student)
            db.flush()

        if user.teacher:
            db.delete(user.teacher)
            db.flush()

        user.role_id = user_data.role_id

        if new_role.role_name == "student":
            if user_data.group_id is None:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Для студента необходимо указать группу",
                )
            db.add(Student(user_id=user.user_id, group_id=user_data.group_id))

        elif new_role.role_name == "teacher":
            if user_data.department_id is None:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Для преподавателя необходимо указать кафедру",
                )
            db.add(Teacher(user_id=user.user_id, department_id=user_data.department_id))

    else:
        effective_role_name = new_role.role_name if new_role else None

        if effective_role_name == "student" and user.student and user_data.group_id is not None:
            user.student.group_id = user_data.group_id

        if effective_role_name == "teacher" and user.teacher and user_data.department_id is not None:
            user.teacher.department_id = user_data.department_id

    db.commit()

    user = (
        db.query(User)
        .options(
            joinedload(User.role),
            joinedload(User.student),
            joinedload(User.teacher),
        )
        .filter(User.user_id == user_id)
        .first()
    )

    return build_user_response(user)


@router.delete("/{user_id}")
def delete_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    if current_user["role_name"] != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Недостаточно прав",
        )

    user = (
        db.query(User)
        .options(
            joinedload(User.student),
            joinedload(User.teacher),
        )
        .filter(User.user_id == user_id)
        .first()
    )

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Пользователь не найден",
        )

    if user.student:
        db.delete(user.student)
    if user.teacher:
        db.delete(user.teacher)

    db.delete(user)
    db.commit()

    return {
        "message": "Пользователь удалён",
        "user_id": user_id,
    }