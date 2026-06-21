"""반납 어시스턴트 파사드 — settings.agent_backend 로 LLM 백엔드를 선택한다.

  - "gemini" (기본): Gemini 2.5 Flash, API 키 필요, 배포 가능.
  - "claude"        : Claude Agent SDK(구독 인증), 로컬 전용 — 배포 서버에선 동작 안 함.

라우터는 이 파사드의 run_chat / AgentUnavailable 만 의존한다. 백엔드 교체는 .env 의
AGENT_BACKEND 한 줄로 끝난다 (vendor lock-in 제거).
"""
from sqlalchemy.orm import Session
from starlette.concurrency import run_in_threadpool

from ..core.config import settings
from ..models import User
from .agent_tools import AgentUnavailable  # 라우터가 agent_service.AgentUnavailable 로 참조

__all__ = ["run_chat", "AgentUnavailable"]


async def run_chat(
    db: Session,
    user: User,
    message: str,
    history: list[dict] | None = None,
    image_path: str | None = None,
) -> dict:
    backend = (settings.agent_backend or "gemini").lower()

    if backend == "claude":
        from . import agent_claude  # lazy: claude-agent-sdk 미설치 환경 보호

        return await agent_claude.run_chat(db, user, message, history, image_path)

    # 기본: Gemini. 동기(blocking) SDK 호출이 이벤트 루프를 막지 않도록 threadpool 위임.
    from . import agent_gemini

    return await run_in_threadpool(
        agent_gemini.run_chat, db, user, message, history, image_path
    )
