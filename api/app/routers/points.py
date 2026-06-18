from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.orm import Session

from ..core.db import get_db
from ..deps import get_current_user
from ..models import PointTransaction, User
from ..schemas import PointTxOut

router = APIRouter(prefix="/api/points", tags=["points"])


@router.get("", response_model=list[PointTxOut])
def my_point_history(
    user: User = Depends(get_current_user), db: Session = Depends(get_db)
):
    stmt = (
        select(PointTransaction)
        .where(PointTransaction.user_id == user.id)
        .order_by(PointTransaction.created_at.desc(), PointTransaction.id.desc())
    )
    return list(db.scalars(stmt))


@router.get("/balance")
def my_balance(user: User = Depends(get_current_user)):
    return {"balance": user.total_point, "grade": user.grade}
