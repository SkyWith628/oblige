"""주문 서비스 — 가격·재고를 서버에서 재확정하고 한 트랜잭션으로 처리."""
from datetime import datetime, timezone

from fastapi import HTTPException, status
from sqlalchemy import delete, select
from sqlalchemy.orm import Session

from ..models import CartItem, Order, OrderItem, OrderStatusHistory, Product, User
from . import inventory, points
from .transitions import ORDER_TRANSITIONS, assert_transition

SHIPPING_FREE_THRESHOLD = 50_000
SHIPPING_FEE = 3_000


def create_order(
    db: Session,
    user: User,
    items: list,  # [{product_id, quantity}] (Pydantic 객체)
    used_point: int = 0,
    delivery_address: str | None = None,
) -> Order:
    if not items:
        raise HTTPException(status.HTTP_422_UNPROCESSABLE_ENTITY, "주문 항목이 없습니다")

    total = 0
    earn_total = 0
    resolved: list[tuple[Product, int]] = []
    for it in items:
        # 행 잠금 + 서버 측 가격/재고 확정 (클라이언트 값 신뢰 금지)
        product = db.scalar(
            select(Product).where(Product.id == it.product_id).with_for_update()
        )
        if product is None or not product.is_active:
            raise HTTPException(status.HTTP_404_NOT_FOUND, f"상품을 찾을 수 없습니다: {it.product_id}")
        if it.quantity <= 0:
            raise HTTPException(status.HTTP_422_UNPROCESSABLE_ENTITY, "수량은 1 이상이어야 합니다")
        if product.stock < it.quantity:
            raise HTTPException(status.HTTP_409_CONFLICT, f"재고가 부족합니다: {product.name}")
        total += product.price * it.quantity
        earn_total += product.earn_point * it.quantity
        resolved.append((product, it.quantity))

    if used_point < 0:
        raise HTTPException(status.HTTP_422_UNPROCESSABLE_ENTITY, "사용 포인트가 올바르지 않습니다")
    if used_point > user.total_point:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "포인트 잔액이 부족합니다")
    if used_point > total:
        raise HTTPException(status.HTTP_422_UNPROCESSABLE_ENTITY, "사용 포인트가 주문 금액을 초과합니다")

    shipping = 0 if total >= SHIPPING_FREE_THRESHOLD else SHIPPING_FEE

    order = Order(
        user_id=user.id,
        total_price=total,
        used_point=used_point,
        earned_point=earn_total,
        shipping_fee=shipping,
        delivery_address=delivery_address,
        order_status="ORDERED",
    )
    db.add(order)
    db.flush()  # order.id / order_number 확보

    for product, qty in resolved:
        db.add(
            OrderItem(
                order_id=order.id,
                product_id=product.id,
                product_name=product.name,
                quantity=qty,
                unit_price=product.price,
            )
        )
        inventory.adjust(
            db, product, -qty, "ORDER",
            reference_type="orders", reference_id=order.id, reason="주문 차감",
        )

    if used_point > 0:
        points.use(
            db, user, used_point, "주문 포인트 사용",
            idempotency_key=f"order:{order.id}:use", ref_table="orders", ref_id=order.id,
        )
    if earn_total > 0:
        points.earn(
            db, user, earn_total, "구매 적립",
            idempotency_key=f"order:{order.id}:earn", ref_table="orders", ref_id=order.id,
        )

    db.add(OrderStatusHistory(
        order_id=order.id, from_status=None, to_status="ORDERED",
        reason="주문 생성", changed_by=user.id,
    ))
    db.execute(delete(CartItem).where(CartItem.user_id == user.id))

    db.commit()
    db.refresh(order)
    return order


def cancel_order(
    db: Session, user: User, order_id: int, reason: str | None = None
) -> Order:
    order = db.scalar(select(Order).where(Order.id == order_id).with_for_update())
    if order is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "주문을 찾을 수 없습니다")
    if order.user_id != user.id and user.role != "admin":
        raise HTTPException(status.HTTP_403_FORBIDDEN, "본인 주문만 취소할 수 있습니다")

    assert_transition(ORDER_TRANSITIONS, order.order_status, "CANCELLED")
    prev = order.order_status

    # 재고 복원
    for item in order.items:
        product = db.scalar(
            select(Product).where(Product.id == item.product_id).with_for_update()
        )
        if product is not None:
            inventory.adjust(
                db, product, item.quantity, "CANCEL",
                reference_type="orders", reference_id=order.id, reason="주문 취소 복원",
            )

    owner = db.get(User, order.user_id)
    # 사용 포인트 환급 + 적립 포인트 회수 (멱등)
    if order.used_point > 0:
        points.earn(
            db, owner, order.used_point, "주문 취소 포인트 환급",
            idempotency_key=f"order:{order.id}:refund-use", ref_table="orders", ref_id=order.id,
        )
    if order.earned_point > 0:
        points.use(
            db, owner, order.earned_point, "주문 취소 적립 회수",
            idempotency_key=f"order:{order.id}:clawback", ref_table="orders", ref_id=order.id,
        )

    order.order_status = "CANCELLED"
    order.cancel_reason = reason
    order.cancelled_at = datetime.now(timezone.utc)
    db.add(OrderStatusHistory(
        order_id=order.id, from_status=prev, to_status="CANCELLED",
        reason=reason, changed_by=user.id,
    ))

    db.commit()
    db.refresh(order)
    return order
