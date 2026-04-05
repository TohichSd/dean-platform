from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload

from server.app.db.database import get_db
from server.app.dependencies.auth import require_admin_or_dean
from server.app.db.models import Attempt

router = APIRouter(prefix="/attempts", tags=["Attempts"])


@router.delete("/{attempt_id}")
def delete_attempt(
    attempt_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(require_admin_or_dean),
):
    attempt = (
        db.query(Attempt)
        .options(joinedload(Attempt.result))
        .filter(Attempt.attempt_id == attempt_id)
        .first()
    )

    if not attempt:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Попытка не найдена",
        )

    if attempt.result:
        db.delete(attempt.result)

    db.delete(attempt)
    db.commit()

    return {
        "message": "Попытка удалена",
        "attempt_id": attempt_id,
    }