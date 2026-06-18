from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from ..core.db import get_db
from ..deps import get_current_user
from ..models import Order, User
from ..schemas import OrderCancel, OrderCreate, OrderOut
from ..services import orders as order_service

router = APIRouter(prefix="/api/orders", tags=["orders"])


@router.post("", response_model=OrderOut, status_code=status.HTTP_201_CREATED)
def create_order(
    data: OrderCreate,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return order_service.create_order(
        db, user, data.items, used_point=data.used_point,
        delivery_address=data.delivery_address,
    )


@router.get("", response_model=list[OrderOut])
def my_orders(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    stmt = select(Order).where(Order.user_id == user.id).order_by(Order.id.desc())
    return list(db.scalars(stmt))


@router.get("/{order_id}", response_model=OrderOut)
def get_order(
    order_id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    order = db.get(Order, order_id)
    if order is None or (order.user_id != user.id and user.role != "admin"):
        raise HTTPException(status.HTTP_404_NOT_FOUND, "주문을 찾을 수 없습니다")
    return order


@router.post("/{order_id}/cancel", response_model=OrderOut)
def cancel_order(
    order_id: int,
    data: OrderCancel,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return order_service.cancel_order(db, user, order_id, reason=data.reason)
