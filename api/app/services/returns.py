"""공병 반납 서비스. APPROVED 전환 시에만 포인트 지급 + 등급 재계산 (멱등)."""
from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from ..models import EmptyBottleReturn, ReturnStatusHistory, User
from . import grades, points
from .transitions import RETURN_TRANSITIONS, assert_transition

POINT_PER_BOTTLE = 500


def create_return(
    db: Session,
    user: User,
    bottle_count: int,
    return_method: str = "DELIVERY",
    photo_urls: list[str] | None = None,
    ai_detection: dict | None = None,
) -> EmptyBottleReturn:
    if bottle_count <= 0:
        raise HTTPException(status.HTTP_422_UNPROCESSABLE_ENTITY, "공병 수량은 1 이상이어야 합니다")

    r = EmptyBottleReturn(
        user_id=user.id,
        bottle_count=bottle_count,
        return_method=return_method,
        photo_urls=photo_urls or [],
        ai_detection=ai_detection,
        return_status="REQUESTED",
    )
    db.add(r)
    db.flush()
    db.add(ReturnStatusHistory(
        return_id=r.id, from_status=None, to_status="REQUESTED",
        reason="반납 신청", changed_by=user.id,
    ))
    db.commit()
    db.refresh(r)
    return r


def transition(
    db: Session,
    admin: User,
    return_id: int,
    target: str,
    reason: str | None = None,
    approved_point: int | None = None,
) -> EmptyBottleReturn:
    r = db.scalar(
        select(EmptyBottleReturn).where(EmptyBottleReturn.id == return_id).with_for_update()
    )
    if r is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "반납 신청을 찾을 수 없습니다")

    assert_transition(RETURN_TRANSITIONS, r.return_status, target)
    prev = r.return_status

    if target == "APPROVED":
        owner = db.scalar(select(User).where(User.id == r.user_id).with_for_update())
        reward = approved_point if approved_point is not None else r.bottle_count * POINT_PER_BOTTLE
        # 멱등키로 중복 지급 차단
        points.earn(
            db, owner, reward, "공병 반납 승인",
            idempotency_key=f"return:{r.id}:reward",
            ref_table="empty_bottle_returns", ref_id=r.id,
        )
        owner.bottle_return_count += r.bottle_count
        grades.recalc(db, owner)
        r.approved_point = reward

    r.return_status = target
    if reason:
        r.inspection_memo = reason
    db.add(ReturnStatusHistory(
        return_id=r.id, from_status=prev, to_status=target,
        reason=reason, changed_by=admin.id,
    ))

    db.commit()
    db.refresh(r)
    return r
