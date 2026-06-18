from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from ..core.db import get_db
from ..deps import get_current_user, require_admin
from ..models import EmptyBottleReturn, User
from ..schemas import ReturnCreate, ReturnOut, ReturnStatusUpdate
from ..services import returns as return_service

router = APIRouter(prefix="/api/returns", tags=["returns"])


@router.post("", response_model=ReturnOut, status_code=status.HTTP_201_CREATED)
def create_return(
    data: ReturnCreate,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return return_service.create_return(
        db, user, data.bottle_count, data.return_method,
        data.photo_urls, data.ai_detection,
    )


@router.get("", response_model=list[ReturnOut])
def my_returns(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    stmt = (
        select(EmptyBottleReturn)
        .where(EmptyBottleReturn.user_id == user.id)
        .order_by(EmptyBottleReturn.id.desc())
    )
    return list(db.scalars(stmt))


@router.get("/{return_id}", response_model=ReturnOut)
def get_return(
    return_id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    r = db.get(EmptyBottleReturn, return_id)
    if r is None or (r.user_id != user.id and user.role != "admin"):
        raise HTTPException(status.HTTP_404_NOT_FOUND, "반납 신청을 찾을 수 없습니다")
    return r


@router.patch("/{return_id}/status", response_model=ReturnOut)
def transition_status(
    return_id: int,
    data: ReturnStatusUpdate,
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    """관리자 전용 — 상태 전이. APPROVED 전환 시 포인트 지급 + 등급 재계산."""
    return return_service.transition(
        db, admin, return_id, data.target_status,
        reason=data.reason, approved_point=data.approved_point,
    )
