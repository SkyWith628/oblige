"""Pydantic 입출력 스키마 (API 스펙 정의)."""
from datetime import datetime

from pydantic import BaseModel, ConfigDict, EmailStr, Field


# ── 인증 ──────────────────────────────────────────────
class UserCreate(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8)
    name: str = "회원"


class UserOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    email: EmailStr
    name: str
    role: str
    grade: str
    total_point: int
    bottle_return_count: int


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


# ── 상품 ──────────────────────────────────────────────
class ProductOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    category_id: int
    name: str
    price: int
    stock: int
    description: str | None = None
    is_vegan: bool
    is_refillable: bool
    return_point: int
    earn_point: int


# ── 장바구니 ──────────────────────────────────────────
class CartItemIn(BaseModel):
    product_id: int
    quantity: int = Field(default=1, gt=0)


class CartQuantityUpdate(BaseModel):
    quantity: int = Field(gt=0)


class CartItemOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    quantity: int
    product: ProductOut


# ── 주문 ──────────────────────────────────────────────
class OrderItemIn(BaseModel):
    product_id: int
    quantity: int = Field(gt=0)


class OrderCreate(BaseModel):
    items: list[OrderItemIn]
    used_point: int = Field(default=0, ge=0)
    delivery_address: str | None = None


class OrderCancel(BaseModel):
    reason: str | None = None


class OrderItemOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    product_id: int
    product_name: str
    quantity: int
    unit_price: int
    subtotal: int


class OrderOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    order_number: str
    total_price: int
    used_point: int
    earned_point: int
    shipping_fee: int
    final_price: int
    order_status: str
    delivery_address: str | None = None
    tracking_number: str | None = None
    created_at: datetime
    items: list[OrderItemOut]


# ── 공병 반납 ─────────────────────────────────────────
class ReturnCreate(BaseModel):
    bottle_count: int = Field(gt=0)
    return_method: str = "DELIVERY"
    photo_urls: list[str] = []
    ai_detection: dict | None = None


class ReturnStatusUpdate(BaseModel):
    target_status: str
    reason: str | None = None
    approved_point: int | None = None


class ReturnOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    return_number: str
    bottle_count: int
    return_method: str
    photo_urls: list[str]
    ai_detection: dict | None = None
    return_status: str
    approved_point: int
    created_at: datetime


# ── 포인트 ────────────────────────────────────────────
class PointTxOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    point_change: int
    balance_after: int
    tx_type: str
    reason: str | None = None
    created_at: datetime


# ── AI 추론 ───────────────────────────────────────────
class Detection(BaseModel):
    label: str
    confidence: float
    box: list[float]


class DetectResult(BaseModel):
    detections: list[Detection]
    counts: dict[str, int]
    total: int
