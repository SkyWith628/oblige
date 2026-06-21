"""반납 어시스턴트 — Claude Agent SDK 백엔드 (구독 인증, 로컬 전용).

이 백엔드는 **Anthropic API 토큰을 쓰지 않고**, 로컬에 설치·로그인된 Claude Code CLI의
구독 인증을 그대로 사용한다 (claude-agent-sdk 가 내부적으로 CLI 프로세스를 띄움).

전제 조건:
  1. Claude Code CLI 설치 + 구독 로그인 (`claude` 실행 → /login).
  2. `pip install claude-agent-sdk`.
배포 서버(Vercel/Railway)에는 구독 로그인이 없으므로 동작하지 않는다 → 그쪽은 Gemini 사용.

설계:
  - 도구는 in-process MCP 서버로 노출한다 (별도 프로세스 아님).
  - 도구 핸들러는 db/user/image_path 를 직접 인자로 못 받으므로 contextvar 로 주입한다.
    (contextvar: 같은 async 태스크 안에서만 보이는 요청 단위 컨텍스트 → 동시 요청에 안전)
  - 도구 실행 로직은 agent_tools 의 순수 함수를 재사용한다 (Gemini 백엔드와 동일).
"""
import contextvars
import json
from typing import Any

from sqlalchemy.orm import Session

from ..core.config import settings
from ..models import User
from .agent_tools import (
    MAX_TOOL_ROUNDS,
    AgentUnavailable,
    create_return_impl,
    detect_bottle_impl,
    membership_impl,
    system_prompt,
)

# 요청 단위 컨텍스트 — 도구 핸들러가 여기서 db/user/image_path/actions 를 읽는다.
_ctx: contextvars.ContextVar[dict] = contextvars.ContextVar("oblige_agent_ctx")


def _text_result(out: dict) -> dict[str, Any]:
    """도구 결과 딕셔너리를 MCP CallToolResult 형식으로 포장. error 키가 있으면 is_error 표시."""
    return {
        "content": [{"type": "text", "text": json.dumps(out, ensure_ascii=False)}],
        "is_error": "error" in out,
    }


def _build_tools() -> list:
    """@tool 데코레이터로 3개 도구를 정의해 리스트로 반환. import 는 호출 시점(lazy)."""
    from claude_agent_sdk import tool

    @tool(
        "detect_bottle",
        "사용자가 이번 대화에 업로드한 공병 사진을 YOLO 모델로 분석해 종류별 개수와 "
        "총 개수를 반환한다. 사진이 없으면 오류를 반환한다.",
        {"type": "object", "properties": {}},  # 무인자
    )
    async def detect_bottle(args: dict[str, Any]) -> dict[str, Any]:
        c = _ctx.get()
        out = detect_bottle_impl(c["db"], c["user"], c["image_path"])
        c["actions"].append({"tool": "detect_bottle", "output": out})
        return _text_result(out)

    @tool(
        "get_membership_status",
        "현재 사용자의 등급, 보유 포인트, 누적 반납 수, 다음 등급까지 남은 공병 수를 조회한다.",
        {"type": "object", "properties": {}},  # 무인자
    )
    async def get_membership_status(args: dict[str, Any]) -> dict[str, Any]:
        c = _ctx.get()
        out = membership_impl(c["db"], c["user"])
        c["actions"].append({"tool": "get_membership_status", "output": out})
        return _text_result(out)

    @tool(
        "create_return",
        "공병 반납 신청을 생성한다. 사용자 동의를 받은 뒤에만 호출한다.",
        {"bottle_count": int},
    )
    async def create_return(args: dict[str, Any]) -> dict[str, Any]:
        c = _ctx.get()
        out = create_return_impl(c["db"], c["user"], args.get("bottle_count", 0))
        c["actions"].append({"tool": "create_return", "output": out})
        return _text_result(out)

    return [detect_bottle, get_membership_status, create_return]


def _build_prompt(history: list[dict] | None, message: str) -> str:
    """텍스트 전용 히스토리를 하나의 프롬프트 문자열로 합친다.

    백엔드는 HTTP 요청마다 stateless 이므로 프런트가 보낸 history 를 매번 주입한다.
    """
    if not history:
        return message
    lines = []
    for h in history:
        speaker = "사용자" if h.get("role") == "user" else "어시스턴트"
        lines.append(f"{speaker}: {h.get('content', '')}")
    lines.append(f"사용자: {message}")
    lines.append("\n(위 대화 맥락을 참고해 마지막 사용자 메시지에 답하세요.)")
    return "\n".join(lines)


async def run_chat(
    db: Session,
    user: User,
    message: str,
    history: list[dict] | None = None,
    image_path: str | None = None,
) -> dict:
    try:
        from claude_agent_sdk import (
            AssistantMessage,
            ClaudeAgentOptions,
            ResultMessage,
            TextBlock,
            create_sdk_mcp_server,
            query,
        )
    except ImportError as e:
        raise AgentUnavailable(
            "claude-agent-sdk 미설치 — `pip install claude-agent-sdk` (+ Claude Code CLI 로그인)"
        ) from e

    server = create_sdk_mcp_server(name="oblige", version="1.0.0", tools=_build_tools())
    options = ClaudeAgentOptions(
        system_prompt=system_prompt(user),
        mcp_servers={"oblige": server},
        allowed_tools=[
            "mcp__oblige__detect_bottle",
            "mcp__oblige__get_membership_status",
            "mcp__oblige__create_return",
        ],
        tools=[],                 # 빌트인 도구(Bash/Read/Write 등) 전부 제거 → 우리 도구만
        setting_sources=[],       # 사용자/프로젝트 settings·CLAUDE.md 미로딩 (격리)
        permission_mode="dontAsk",  # 사전 허용 도구 외엔 거부 → 헤드리스에서 권한 프롬프트 방지
        max_turns=MAX_TOOL_ROUNDS,
        model=settings.agent_model_claude,  # None 이면 CLI 기본(구독 모델)
    )

    ctx = {"db": db, "user": user, "image_path": image_path, "actions": []}
    token = _ctx.set(ctx)
    reply = ""
    text_fallback: list[str] = []
    try:
        async for msg in query(prompt=_build_prompt(history, message), options=options):
            if isinstance(msg, ResultMessage):
                if msg.subtype == "success" and msg.result:
                    reply = msg.result
            elif isinstance(msg, AssistantMessage):
                # ResultMessage.result 가 비는 경우를 대비한 폴백 텍스트 수집
                for block in msg.content:
                    if isinstance(block, TextBlock):
                        text_fallback.append(block.text)
    except Exception as e:  # SDK/CLI 오류(미로그인·미설치 등)를 503 로 명확히 surface
        raise AgentUnavailable(f"Claude Agent SDK 오류: {e}") from e
    finally:
        _ctx.reset(token)

    return {"reply": reply or "".join(text_fallback).strip(), "actions": ctx["actions"]}
