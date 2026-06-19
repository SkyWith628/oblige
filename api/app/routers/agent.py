"""반납 어시스턴트 챗 엔드포인트 (멀티파트: 메시지 + 선택 사진 + 선택 히스토리)."""
import json
import os
import tempfile

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status
from fastapi.concurrency import run_in_threadpool
from sqlalchemy.orm import Session

from ..core.db import get_db
from ..deps import get_current_user
from ..models import User
from ..services import agent as agent_service

router = APIRouter(prefix="/api/agent", tags=["agent"])


@router.post("/chat")
async def chat(
    message: str = Form(...),
    history: str | None = Form(None),  # JSON 배열 [{role, content}] (텍스트 전용)
    image: UploadFile | None = File(None),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    parsed_history = None
    if history:
        try:
            parsed_history = json.loads(history)
        except json.JSONDecodeError:
            raise HTTPException(status.HTTP_422_UNPROCESSABLE_ENTITY, "history JSON 형식 오류")

    tmp_path = None
    try:
        if image is not None:
            suffix = os.path.splitext(image.filename or "")[1] or ".jpg"
            with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
                tmp.write(await image.read())
                tmp_path = tmp.name

        try:
            # run_chat 은 동기 블로킹(LLM 네트워크 I/O + DB) — 스레드풀에 위임해
            # 이벤트 루프(다른 요청)를 막지 않는다.
            return await run_in_threadpool(
                agent_service.run_chat, db, user, message, parsed_history, tmp_path
            )
        except agent_service.AgentUnavailable as e:
            raise HTTPException(status.HTTP_503_SERVICE_UNAVAILABLE, str(e))
    finally:
        if tmp_path and os.path.exists(tmp_path):
            os.remove(tmp_path)
