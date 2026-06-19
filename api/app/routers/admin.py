"""어드민 운영 콘솔 — 대시보드 집계·반납 검수·회원·굿즈 재고 (require_admin)."""
from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from ..core.db import get_db
from ..deps import require_admin
from ..models import Category, EmptyBottleReturn, PointTransaction, Product, User

router = APIRouter(prefix="/api/admin", tags=["admin"])


@router.get("/stats")
def stats(_: User = Depends(require_admin), db: Session = Depends(get_db)):
    """E1 대시보드 KPI."""
    pending = db.scalar(
        select(func.count())
        .select_from(EmptyBottleReturn)
        .where(EmptyBottleReturn.return_status == "REQUESTED")
    )
    members = db.scalar(select(func.count()).select_from(User))
    total_returns = db.scalar(select(func.count()).select_from(EmptyBottleReturn))
    issued = db.scalar(
        select(func.coalesce(func.sum(PointTransaction.point_change), 0)).where(
            PointTransaction.point_change > 0
        )
    )
    return {
        "pending_returns": int(pending or 0),
        "members": int(members or 0),
        "total_returns": int(total_returns or 0),
        "issued_points": int(issued or 0),
    }


@router.get("/returns")
def list_returns(
    status: str | None = Query(None),
    _: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    """E2 반납 검수 — 전체(또는 상태별) 반납 + 신청 회원 정보."""
    stmt = select(EmptyBottleReturn).order_by(EmptyBottleReturn.id.desc())
    if status:
        stmt = stmt.where(EmptyBottleReturn.return_status == status)
    out = []
    for r in db.scalars(stmt):
        u = db.get(User, r.user_id)
        out.append(
            {
                "id": r.id,
                "return_number": r.return_number,
                "bottle_count": r.bottle_count,
                "return_method": r.return_method,
                "return_status": r.return_status,
                "approved_point": r.approved_point,
                "created_at": r.created_at,
                "user_name": u.name if u else None,
                "user_email": u.email if u else None,
                "user_grade": u.grade if u else None,
            }
        )
    return out


@router.get("/products")
def list_products(_: User = Depends(require_admin), db: Session = Depends(get_db)):
    """E4 굿즈·재고 — 활성/비활성 포함 전체 상품 + 카테고리명."""
    cats = {c.id: c.name for c in db.scalars(select(Category))}
    low_threshold = 10  # 모델에 low_stock_threshold 미매핑 → 고정 임계값 사용
    out = []
    for p in db.scalars(select(Product).order_by(Product.sort_order, Product.id)):
        out.append(
            {
                "id": p.id,
                "name": p.name,
                "category": cats.get(p.category_id, "굿즈"),
                "price": p.price,
                "stock": p.stock,
                "low_stock_threshold": low_threshold,
                "is_active": p.is_active,
            }
        )
    return out


class ProductAdminUpdate(BaseModel):
    price: int | None = None
    stock: int | None = None
    is_active: bool | None = None


@router.patch("/products/{product_id}")
def update_product(
    product_id: int,
    data: ProductAdminUpdate,
    _: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    """E4 — 가격/재고/노출 수정."""
    p = db.get(Product, product_id)
    if p is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "상품을 찾을 수 없습니다")
    if data.price is not None:
        p.price = data.price
    if data.stock is not None:
        p.stock = data.stock
    if data.is_active is not None:
        p.is_active = data.is_active
    db.commit()
    return {"ok": True}


@router.get("/users")
def list_users(_: User = Depends(require_admin), db: Session = Depends(get_db)):
    """E3 회원 관리 — 회원 목록."""
    rows = db.scalars(select(User).order_by(User.id.desc()))
    return [
        {
            "id": u.id,
            "name": u.name,
            "email": u.email,
            "grade": u.grade,
            "total_point": u.total_point,
            "bottle_return_count": u.bottle_return_count,
            "is_active": u.is_active,
            "created_at": u.created_at,
        }
        for u in rows
    ]
