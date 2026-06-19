"""AI 공병 인식 라우터. 사용자가 올린 사진에서 공병 종류·개수를 탐지."""
import os
import tempfile

from fastapi import APIRouter, File, HTTPException, UploadFile, status
from fastapi.concurrency import run_in_threadpool

from ..schemas import DetectResult
from ..services.inference import ModelUnavailable, get_detector

router = APIRouter(prefix="/api/ai", tags=["ai"])

ALLOWED = {"image/jpeg", "image/png", "image/webp"}


@router.post("/detect-bottle", response_model=DetectResult)
async def detect_bottle(file: UploadFile = File(...)):
    if file.content_type not in ALLOWED:
        raise HTTPException(
            status.HTTP_422_UNPROCESSABLE_ENTITY,
            "이미지 파일(jpg/png/webp)만 업로드할 수 있습니다",
        )

    suffix = os.path.splitext(file.filename or "")[1] or ".jpg"
    tmp_path = None
    try:
        with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
            tmp.write(await file.read())
            tmp_path = tmp.name

        try:
            detector = get_detector()
        except ModelUnavailable as e:
            raise HTTPException(status.HTTP_503_SERVICE_UNAVAILABLE, str(e))

        # YOLO 추론은 CPU 블로킹 — 스레드풀에 위임해 이벤트 루프를 막지 않는다.
        return await run_in_threadpool(detector.detect, tmp_path)
    finally:
        if tmp_path and os.path.exists(tmp_path):
            os.remove(tmp_path)
