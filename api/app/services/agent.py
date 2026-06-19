"""반납 어시스턴트 — Gemini 2.5 Flash(function calling)가 비전·DB 도구를 호출하는 에이전트.

도구:
  - detect_bottle        : 업로드된 사진을 YOLO로 분석 (종류·개수)
  - get_membership_status: 현재 사용자의 등급·포인트·누적 반납
  - create_return        : 공병 반납 신청 생성

GOOGLE_API_KEY 미설정 또는 google-genai 미설치 시 AgentUnavailable.
(임시로 Gemini 사용 — 원래 설계는 Claude tool use)
"""
from sqlalchemy import select
from sqlalchemy.orm import Session

from ..core.config import settings
from ..models import MembershipGrade, User
from . import inference
from . import returns as return_service

MAX_TOOL_ROUNDS = 8


class AgentUnavailable(RuntimeError):
    pass


def _system_prompt(user: User) -> str:
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


# Gemini function declarations — Claude의 input_schema 대신 parameters 키 사용.
# 무인자 도구는 parameters 를 생략한다(Gemini는 빈 properties 객체를 거부할 수 있음).
TOOLS = [
    {
        "name": "detect_bottle",
        "description": "사용자가 이번 대화에 업로드한 공병 사진을 YOLO 모델로 분석해 "
        "종류별 개수와 총 개수를 반환한다. 사진이 없으면 오류를 반환한다.",
    },
    {
        "name": "get_membership_status",
        "description": "현재 사용자의 등급, 보유 포인트, 누적 반납 수, 다음 등급까지 "
        "남은 공병 수를 조회한다.",
    },
    {
        "name": "create_return",
        "description": "공병 반납 신청을 생성한다. 사용자 동의를 받은 뒤에만 호출한다.",
        "parameters": {
            "type": "object",
            "properties": {
                "bottle_count": {"type": "integer", "description": "반납할 공병 개수 (1 이상)"},
            },
            "required": ["bottle_count"],
        },
    },
]


def _dispatch(name: str, tool_input: dict, db: Session, user: User, image_path: str | None) -> dict:
    if name == "detect_bottle":
        if not image_path:
            return {"error": "분석할 사진이 없습니다. 사용자에게 공병 사진을 요청하세요."}
        try:
            detector = inference.get_detector()
        except inference.ModelUnavailable as e:
            return {"error": str(e)}
        return detector.detect(image_path)

    if name == "get_membership_status":
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

    if name == "create_return":
        count = int(tool_input.get("bottle_count", 0))
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

    return {"error": f"알 수 없는 도구: {name}"}


def _client():
    try:
        from google import genai
    except ImportError as e:
        raise AgentUnavailable("google-genai 미설치 — `pip install google-genai`") from e
    if not settings.google_api_key:
        raise AgentUnavailable("GOOGLE_API_KEY 미설정")
    return genai.Client(api_key=settings.google_api_key)


def _to_contents(history: list[dict] | None, message: str) -> list[dict]:
    """프런트 히스토리([{role, content}], 텍스트 전용)를 Gemini contents 포맷으로 변환.

    Claude 역할(user/assistant) → Gemini 역할(user/model) 매핑.
    """
    contents: list[dict] = []
    for h in history or []:
        role = "user" if h.get("role") == "user" else "model"
        contents.append({"role": role, "parts": [{"text": h.get("content", "")}]})
    contents.append({"role": "user", "parts": [{"text": message}]})
    return contents


def run_chat(
    db: Session,
    user: User,
    message: str,
    history: list[dict] | None = None,
    image_path: str | None = None,
) -> dict:
    from google.genai import types

    client = _client()
    contents = _to_contents(history, message)
    actions: list[dict] = []

    # 함수 호출을 우리가 직접 루프 돌리므로 자동 실행은 끈다.
    config = types.GenerateContentConfig(
        system_instruction=_system_prompt(user),
        tools=[types.Tool(function_declarations=TOOLS)],
        automatic_function_calling=types.AutomaticFunctionCallingConfig(disable=True),
    )

    for _ in range(MAX_TOOL_ROUNDS):
        resp = client.models.generate_content(
            model=settings.agent_model,
            contents=contents,
            config=config,
        )

        candidate = resp.candidates[0] if resp.candidates else None
        parts = (candidate.content.parts if candidate and candidate.content else None) or []
        calls = [p.function_call for p in parts if getattr(p, "function_call", None)]

        if not calls:
            # 도구 호출이 없으면 최종 답변. .text 는 텍스트 파트만 모아준다.
            return {"reply": resp.text or "", "actions": actions}

        # 모델 턴(함수 호출 포함)을 그대로 대화에 보존
        contents.append(candidate.content)
        response_parts = []
        for fc in calls:
            out = _dispatch(fc.name, dict(fc.args or {}), db, user, image_path)
            actions.append({"tool": fc.name, "output": out})
            response_parts.append(
                types.Part.from_function_response(name=fc.name, response=out)
            )
        contents.append(types.Content(role="user", parts=response_parts))

    return {"reply": "대화가 너무 길어졌습니다. 다시 시도해 주세요.", "actions": actions}
