from fastapi import APIRouter

from server.app.schemas.result import ResultCreate, ResultRead, ResultUpdate

router = APIRouter(prefix="/results", tags=["Results"])


@router.get("/", response_model=list[ResultRead])
def get_results():
    return [
        {
            "result_id": 1,
            "result_value": 5,
            "attempt_id": 1,
            "is_absent": False,
        }
    ]


@router.get("/{result_id}", response_model=ResultRead)
def get_result(result_id: int):
    return {
        "result_id": result_id,
        "result_value": 5,
        "attempt_id": 1,
        "is_absent": False,
    }


@router.post("/", response_model=ResultRead)
def create_result(result: ResultCreate):
    return {
        "result_id": 100,
        "result_value": result.result_value,
        "attempt_id": result.attempt_id,
        "is_absent": result.is_absent,
    }


@router.put("/{result_id}", response_model=ResultRead)
def update_result(result_id: int, result: ResultUpdate):
    return {
        "result_id": result_id,
        "result_value": result.result_value,
        "attempt_id": result.attempt_id or 1,
        "is_absent": result.is_absent if result.is_absent is not None else False,
    }


@router.delete("/{result_id}")
def delete_result(result_id: int):
    return {"message": "Результат удалён", "result_id": result_id}