"""상태 전이 검증. 허용된 전이만 통과시킨다 (db/schema.sql 주석 기준)."""
from fastapi import HTTPException, status

ORDER_TRANSITIONS: dict[str, set[str]] = {
    "ORDERED": {"PAID", "CANCELLED"},
    "PAID": {"PREPARING", "CANCELLED", "REFUNDED"},
    "PREPARING": {"SHIPPING", "REFUNDED"},
    "SHIPPING": {"DELIVERED", "REFUNDED"},
    "DELIVERED": {"REFUNDED"},
}

RETURN_TRANSITIONS: dict[str, set[str]] = {
    "REQUESTED": {"COLLECTING", "INSPECTING", "REJECTED"},
    "COLLECTING": {"INSPECTING", "REJECTED"},
    "INSPECTING": {"APPROVED", "REJECTED"},
}


def assert_transition(table: dict[str, set[str]], current: str, target: str) -> None:
    if target not in table.get(current, set()):
        raise HTTPException(
            status.HTTP_409_CONFLICT,
            f"허용되지 않은 상태 전이입니다: {current} → {target}",
        )
