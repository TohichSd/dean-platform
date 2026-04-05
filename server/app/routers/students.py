from fastapi import APIRouter

from server.app.schemas.student import StudentCreate, StudentRead, StudentUpdate

router = APIRouter(prefix="/students", tags=["Students"])


@router.get("/", response_model=list[StudentRead])
def get_students():
    return [
        {
            "student_id": 1,
            "group_id": 1,
            "user_id": 2,
        }
    ]


@router.get("/{student_id}", response_model=StudentRead)
def get_student(student_id: int):
    return {
        "student_id": student_id,
        "group_id": 1,
        "user_id": 2,
    }


@router.post("/", response_model=StudentRead)
def create_student(student: StudentCreate):
    return {
        "student_id": 100,
        "group_id": student.group_id,
        "user_id": student.user_id,
    }


@router.put("/{student_id}", response_model=StudentRead)
def update_student(student_id: int, student: StudentUpdate):
    return {
        "student_id": student_id,
        "group_id": student.group_id or 1,
        "user_id": student.user_id or 2,
    }


@router.delete("/{student_id}")
def delete_student(student_id: int):
    return {"message": "Студент удалён", "student_id": student_id}


@router.get("/{student_id}/attempts")
def get_student_attempts(student_id: int):
    return {"student_id": student_id, "attempts": []}


@router.get("/{student_id}/results")
def get_student_results(student_id: int):
    return {"student_id": student_id, "results": []}