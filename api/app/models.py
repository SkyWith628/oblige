"""SQLAlchemy ORM 모델 (Phase 3 코어 슬라이스).

db/schema.sql 의 테이블과 매핑한다. 주문/반납/포인트 등 나머지 테이블은
Phase 4에서 해당 엔드포인트와 함께 추가한다.
"""
from datetime import datetime
from decimal import Decimal

from sqlalchemy import ForeignKey, Numeric, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .core.db import Base


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
