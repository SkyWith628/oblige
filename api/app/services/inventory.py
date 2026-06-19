"""재고 원장 헬퍼. products.stock 변경 시 항상 inventory_transactions 에 기록.
commit 하지 않는다 (호출자 트랜잭션 공유)."""
from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from ..models import InventoryTransaction, Product


def adjust(
    db: Session,
    product: Product,
    delta: int,
    tx_type: str,
    *,
    reference_type: str | None = None,
    reference_id: int | None = None,
    reason: str | None = None,
    admin_id: int | None = None,
) -> None:
    new_stock = product.stock + delta
    if new_stock < 0:
        raise HTTPException(
            status.HTTP_409_CONFLICT, f"재고가 부족합니다: {product.name}"
        )
    product.stock = new_stock
    db.add(
        InventoryTransaction(
            product_id=product.id,
            tx_type=tx_type,
            quantity_delta=delta,
            stock_after=new_stock,
            reference_type=reference_type,
            reference_id=reference_id,
            reason=reason,
            admin_id=admin_id,
        )
    )
