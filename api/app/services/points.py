"""포인트 원장 헬퍼.

⚠️ 이 함수들은 commit 하지 않는다 — 호출자(주문/반납 서비스)의 트랜잭션을 공유한다.
   idempotency_key 로 동일 작업의 중복 적립/차감을 차단한다.
"""
from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from ..models import PointTransaction, User


def _apply(
    db: Session,
    user: User,
    change: int,
    tx_type: str,
    reason: str,
    *,
    idempotency_key: str | None = None,
    ref_table: str | None = None,
    ref_id: int | None = None,
    admin_id: int | None = None,
) -> PointTransaction | None:
    if idempotency_key:
        existing = db.scalar(
            select(PointTransaction).where(
                PointTransaction.idempotency_key == idempotency_key
            )
        )
        if existing:
            return existing  # 이미 적용됨 — 멱등

    new_balance = user.total_point + change
    if new_balance < 0:
        raise HTTPException(
            status.HTTP_400_BAD_REQUEST,
            f"포인트 잔액이 부족합니다 (보유: {user.total_point}, 요청: {change})",
        )

    user.total_point = new_balance
    tx = PointTransaction(
        user_id=user.id,
        point_change=change,
        balance_after=new_balance,
        tx_type=tx_type,
        reason=reason,
        idempotency_key=idempotency_key,
        ref_table=ref_table,
        ref_id=ref_id,
        admin_id=admin_id,
    )
    db.add(tx)
    return tx


def earn(db, user, amount, reason, **kw):
    return _apply(db, user, abs(amount), "EARN", reason, **kw)


def use(db, user, amount, reason, **kw):
    return _apply(db, user, -abs(amount), "USE", reason, **kw)
