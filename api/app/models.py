"""SQLAlchemy ORM 모델. db/schema.sql 의 테이블과 매핑한다."""
from datetime import datetime
from decimal import Decimal

from sqlalchemy import FetchedValue, ForeignKey, Numeric, String, func
from sqlalchemy.dialects.postgresql import ARRAY, JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .core.db import Base


# ── 회원 / 등급 ────────────────────────────────────────
class MembershipGrade(Base):
    __tablename__ = "membership_grades"

    grade: Mapped[str] = mapped_column(primary_key=True)
    grade_icon: Mapped[str] = mapped_column(default="🌱")
    min_return_count: Mapped[int] = mapped_column(default=0)
    point_rate: Mapped[Decimal] = mapped_column(Numeric(4, 2), default=Decimal("1.00"))
    benefit: Mapped[str | None] = mapped_column(default=None)


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(primary_key=True)
    email: Mapped[str] = mapped_column(unique=True)
    password_hash: Mapped[str]
    name: Mapped[str] = mapped_column(default="회원")
    phone: Mapped[str | None] = mapped_column(default=None)
    role: Mapped[str] = mapped_column(default="user")
    grade: Mapped[str] = mapped_column(
        ForeignKey("membership_grades.grade"), default="Seed"
    )
    total_point: Mapped[int] = mapped_column(default=0)
    bottle_return_count: Mapped[int] = mapped_column(default=0)
    is_active: Mapped[bool] = mapped_column(default=True)
    created_at: Mapped[datetime] = mapped_column(server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(server_default=func.now())


# ── 상품 / 카테고리 / 재고 ──────────────────────────────
class Category(Base):
    __tablename__ = "categories"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(unique=True)
    sort_order: Mapped[int] = mapped_column(default=0)


class Product(Base):
    __tablename__ = "products"

    id: Mapped[int] = mapped_column(primary_key=True)
    category_id: Mapped[int] = mapped_column(ForeignKey("categories.id"))
    name: Mapped[str]
    price: Mapped[int]
    stock: Mapped[int] = mapped_column(default=0)
    description: Mapped[str | None] = mapped_column(default=None)
    ingredients: Mapped[str | None] = mapped_column(default=None)
    usage_guide: Mapped[str | None] = mapped_column(default=None)
    is_vegan: Mapped[bool] = mapped_column(default=True)
    is_refillable: Mapped[bool] = mapped_column(default=False)
    return_point: Mapped[int] = mapped_column(default=0)
    earn_point: Mapped[int] = mapped_column(default=0)
    is_active: Mapped[bool] = mapped_column(default=True)
    sort_order: Mapped[int] = mapped_column(default=0)

    images: Mapped[list["ProductImage"]] = relationship(
        back_populates="product", cascade="all, delete-orphan"
    )


class ProductImage(Base):
    __tablename__ = "product_images"

    id: Mapped[int] = mapped_column(primary_key=True)
    product_id: Mapped[int] = mapped_column(ForeignKey("products.id", ondelete="CASCADE"))
    image_url: Mapped[str]
    storage_path: Mapped[str | None] = mapped_column(default=None)
    is_main: Mapped[bool] = mapped_column(default=False)
    sort_order: Mapped[int] = mapped_column(default=0)

    product: Mapped["Product"] = relationship(back_populates="images")


class InventoryTransaction(Base):
    __tablename__ = "inventory_transactions"

    id: Mapped[int] = mapped_column(primary_key=True)
    product_id: Mapped[int] = mapped_column(ForeignKey("products.id"))
    tx_type: Mapped[str]  # INITIAL/ORDER/CANCEL/REFUND/ADJUST/RETURN_TO_STOCK
    quantity_delta: Mapped[int]
    stock_after: Mapped[int]
    reference_type: Mapped[str | None] = mapped_column(default=None)
    reference_id: Mapped[int | None] = mapped_column(default=None)
    reason: Mapped[str | None] = mapped_column(default=None)
    admin_id: Mapped[int | None] = mapped_column(ForeignKey("users.id"), default=None)
    created_at: Mapped[datetime] = mapped_column(server_default=func.now())


# ── 장바구니 / 주문 ────────────────────────────────────
class CartItem(Base):
    __tablename__ = "cart_items"

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"))
    product_id: Mapped[int] = mapped_column(ForeignKey("products.id", ondelete="CASCADE"))
    quantity: Mapped[int] = mapped_column(default=1)
    added_at: Mapped[datetime] = mapped_column(server_default=func.now())

    product: Mapped["Product"] = relationship()


class Order(Base):
    __tablename__ = "orders"

    id: Mapped[int] = mapped_column(primary_key=True)
    order_number: Mapped[str] = mapped_column(server_default=FetchedValue())
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"))
    total_price: Mapped[int]
    used_point: Mapped[int] = mapped_column(default=0)
    earned_point: Mapped[int] = mapped_column(default=0)
    shipping_fee: Mapped[int] = mapped_column(default=0)
    # final_price 는 DB GENERATED 컬럼 — 응답에서 계산.
    order_status: Mapped[str] = mapped_column(default="ORDERED")
    delivery_address: Mapped[str | None] = mapped_column(default=None)
    tracking_number: Mapped[str | None] = mapped_column(default=None)
    cancel_reason: Mapped[str | None] = mapped_column(default=None)
    cancelled_at: Mapped[datetime | None] = mapped_column(default=None)
    refunded_at: Mapped[datetime | None] = mapped_column(default=None)
    created_at: Mapped[datetime] = mapped_column(server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(server_default=func.now())

    items: Mapped[list["OrderItem"]] = relationship(
        back_populates="order", cascade="all, delete-orphan"
    )

    @property
    def final_price(self) -> int:
        return self.total_price - self.used_point + self.shipping_fee


class OrderItem(Base):
    __tablename__ = "order_items"

    id: Mapped[int] = mapped_column(primary_key=True)
    order_id: Mapped[int] = mapped_column(ForeignKey("orders.id", ondelete="CASCADE"))
    product_id: Mapped[int] = mapped_column(ForeignKey("products.id"))
    product_name: Mapped[str]  # 주문 시점 스냅샷
    quantity: Mapped[int]
    unit_price: Mapped[int]  # 주문 시점 스냅샷

    order: Mapped["Order"] = relationship(back_populates="items")

    @property
    def subtotal(self) -> int:
        return self.unit_price * self.quantity


class OrderStatusHistory(Base):
    __tablename__ = "order_status_histories"

    id: Mapped[int] = mapped_column(primary_key=True)
    order_id: Mapped[int] = mapped_column(ForeignKey("orders.id", ondelete="CASCADE"))
    from_status: Mapped[str | None] = mapped_column(default=None)
    to_status: Mapped[str]
    reason: Mapped[str | None] = mapped_column(default=None)
    changed_by: Mapped[int | None] = mapped_column(ForeignKey("users.id"), default=None)
    created_at: Mapped[datetime] = mapped_column(server_default=func.now())


# ── 공병 반납 (AI 인식) ─────────────────────────────────
class EmptyBottleReturn(Base):
    __tablename__ = "empty_bottle_returns"

    id: Mapped[int] = mapped_column(primary_key=True)
    return_number: Mapped[str] = mapped_column(server_default=FetchedValue())
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"))
    bottle_count: Mapped[int]
    return_method: Mapped[str] = mapped_column(default="DELIVERY")
    photo_urls: Mapped[list[str]] = mapped_column(ARRAY(String), default=list)
    ai_detection: Mapped[dict | None] = mapped_column(JSONB, default=None)
    return_status: Mapped[str] = mapped_column(default="REQUESTED")
    approved_point: Mapped[int] = mapped_column(default=0)
    inspection_memo: Mapped[str | None] = mapped_column(default=None)
    created_at: Mapped[datetime] = mapped_column(server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(server_default=func.now())


class ReturnStatusHistory(Base):
    __tablename__ = "return_status_histories"

    id: Mapped[int] = mapped_column(primary_key=True)
    return_id: Mapped[int] = mapped_column(
        ForeignKey("empty_bottle_returns.id", ondelete="CASCADE")
    )
    from_status: Mapped[str | None] = mapped_column(default=None)
    to_status: Mapped[str]
    reason: Mapped[str | None] = mapped_column(default=None)
    changed_by: Mapped[int | None] = mapped_column(ForeignKey("users.id"), default=None)
    created_at: Mapped[datetime] = mapped_column(server_default=func.now())


# ── 포인트 원장 ────────────────────────────────────────
class PointTransaction(Base):
    __tablename__ = "point_transactions"

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"))
    point_change: Mapped[int]  # +적립 / -차감
    balance_after: Mapped[int]
    tx_type: Mapped[str]  # EARN/USE/ADJUST
    reason: Mapped[str | None] = mapped_column(default=None)
    idempotency_key: Mapped[str | None] = mapped_column(unique=True, default=None)
    ref_table: Mapped[str | None] = mapped_column(default=None)
    ref_id: Mapped[int | None] = mapped_column(default=None)
    admin_id: Mapped[int | None] = mapped_column(ForeignKey("users.id"), default=None)
    created_at: Mapped[datetime] = mapped_column(server_default=func.now())
