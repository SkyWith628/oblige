"""반납 어시스턴트 — Gemini 2.5 Flash(function calling) 백엔드.

GOOGLE_API_KEY 미설정 또는 google-genai 미설치 시 AgentUnavailable.
도구 구현은 agent_tools 의 순수 함수를 재사용한다 (Claude 백엔드와 동일 로직).
"""
from sqlalchemy.orm import Session

from ..core.config import settings
from ..models import User
from . import agent_state
from .agent_tools import (
    MAX_TOOL_ROUNDS,
    AgentUnavailable,
    ToolContext,
    create_return_impl,
    detect_bottle_impl,
    membership_impl,
    system_prompt,
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


def _dispatch(name: str, tool_input: dict, ctx: ToolContext) -> dict:
    if name == "detect_bottle":
        return detect_bottle_impl(ctx)
    if name == "get_membership_status":
        return membership_impl(ctx)
    if name == "create_return":
        return create_return_impl(ctx, tool_input.get("bottle_count", 0))
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
    ctx = ToolContext(db=db, user=user, image_path=image_path)
    # C2: 이전 턴의 탐지 결과를 복원 (사진 없는 후속 턴에서도 검증 가능)
    ctx.last_detection = agent_state.recall_detection(getattr(user, "id", None))

    # 함수 호출을 우리가 직접 루프 돌리므로 자동 실행은 끈다.
    config = types.GenerateContentConfig(
        system_instruction=system_prompt(user),
        tools=[types.Tool(function_declarations=TOOLS)],
        automatic_function_calling=types.AutomaticFunctionCallingConfig(disable=True),
    )

    try:
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
                out = _dispatch(fc.name, dict(fc.args or {}), ctx)
                actions.append({"tool": fc.name, "output": out})
                response_parts.append(
                    types.Part.from_function_response(name=fc.name, response=out)
                )
            contents.append(types.Content(role="user", parts=response_parts))

        return {"reply": "대화가 너무 길어졌습니다. 다시 시도해 주세요.", "actions": actions}
    finally:
        # C2: 이번 턴의 탐지 결과를 다음 턴을 위해 저장 (소비됐으면 None → 캐시 제거)
        agent_state.remember_detection(getattr(user, "id", None), ctx.last_detection)
