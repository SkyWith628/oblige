"""반납 어시스턴트 공용 모듈 — 백엔드(Gemini/Claude)가 공유하는 도구 구현과 시스템 프롬프트.

LLM 벤더에 독립적인 **순수 함수**로 둔다. 각 백엔드(agent_gemini / agent_claude)는
이 구현을 자기 SDK 형식의 도구로 감싸기만 한다 (Gemini: function_declarations,
Claude: @tool MCP). 도구 로직을 한곳에 모아 두 백엔드가 항상 같게 동작하도록 보장한다.

도구:
  - detect_bottle        : 업로드된 사진을 YOLO로 분석 (종류·개수)
  - get_membership_status: 현재 사용자의 등급·포인트·누적 반납
  - create_return        : 공병 반납 신청 생성
"""
from sqlalchemy import select
from sqlalchemy.orm import Session

from ..models import MembershipGrade, User
from . import inference
from . import returns as return_service

# 도구 루프 최대 라운드 — LLM이 도구를 무한 호출하는 폭주를 막는다.
MAX_TOOL_ROUNDS = 8


class AgentUnavailable(RuntimeError):
    """LLM 백엔드 미설치/미설정/미인증 (예: SDK 미설치, API 키 없음, CLI 미로그인)."""


def system_prompt(user: User) -> str:
    return (
        "당신은 비건·ESG 코스메틱 브랜드 OBLIGE의 '반납 어시스턴트'입니다. "
        "사용자가 공병 반납을 쉽게 하도록 돕습니다.\n"
        f"현재 사용자: {user.name}님 (등급 {user.grade}, 보유 {user.total_point}P, "
        f"누적 반납 {user.bottle_return_count}개).\n\n"
        "원칙:\n"
        "- 사용자가 공병 사진을 올렸다면 detect_bottle 도구로 종류·개수를 확인하세요.\n"
        "- 반납 신청을 만들기 전에 탐지된 개수를 사용자에게 알려주고 동의를 받으세요.\n"
        "- 등급/포인트 질문에는 get_membership_status로 정확한 값을 조회해 답하세요.\n"
        "- 공병 1개당 약 500P가 적립되며, 관리자 검수 후 최종 지급됩니다.\n"
        "- 따뜻하고 간결하게, 한국어로 답하세요."
    )


# ── 도구 구현 (벤더 무관) ───────────────────────────────────────────────


def detect_bottle_impl(db: Session, user: User, image_path: str | None) -> dict:
    """업로드 사진을 YOLO로 분석. 사진이 없거나 모델 미설치면 error 딕셔너리 반환."""
    if not image_path:
        return {"error": "분석할 사진이 없습니다. 사용자에게 공병 사진을 요청하세요."}
    try:
        detector = inference.get_detector()
    except inference.ModelUnavailable as e:
        return {"error": str(e)}
    return detector.detect(image_path)


def membership_impl(db: Session, user: User) -> dict:
    """현재 사용자의 등급·포인트·누적 반납·다음 등급까지 남은 개수."""
    nxt = db.scalar(
        select(MembershipGrade)
        .where(MembershipGrade.min_return_count > user.bottle_return_count)
        .order_by(MembershipGrade.min_return_count.asc())
        .limit(1)
    )
    remaining = (nxt.min_return_count - user.bottle_return_count) if nxt else 0
    return {
        "grade": user.grade,
        "total_point": user.total_point,
        "bottle_return_count": user.bottle_return_count,
        "next_grade": nxt.grade if nxt else None,
        "bottles_to_next_grade": remaining,
    }


def create_return_impl(db: Session, user: User, bottle_count: int) -> dict:
    """공병 반납 신청 생성. 실패 사유는 error 딕셔너리로 LLM에 전달."""
    count = int(bottle_count or 0)
    try:
        r = return_service.create_return(db, user, count)
    except Exception as e:  # noqa: BLE001 — 사용자에게 사유 전달
        return {"error": str(getattr(e, "detail", e))}
    return {
        "return_number": r.return_number,
        "bottle_count": r.bottle_count,
        "status": r.return_status,
        "message": "반납 신청 완료. 관리자 검수 후 포인트가 지급됩니다.",
    }
