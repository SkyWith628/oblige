"""Pydantic 입출력 스키마 (API 스펙 정의)."""
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


# ── AI 추론 ───────────────────────────────────────────
class Detection(BaseModel):
    label: str
    confidence: float
    box: list[float]  # [x1, y1, x2, y2]


class DetectResult(BaseModel):
    detections: list[Detection]
    counts: dict[str, int]  # 종류별 개수 (예: {"토너": 2})
    total: int
