# OBLIGE API — FastAPI (Python 3.12)
# AI 추론(ultralytics/torch ~2GB)은 base 이미지에서 제외 — 미설치 시 /api/ai/* 는 503.
FROM python:3.12-slim

WORKDIR /app
ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PIP_NO_CACHE_DIR=1

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY app ./app

# 비루트 유저로 실행 (보안)
RUN useradd --create-home --uid 1001 appuser
USER appuser

EXPOSE 8000
# Railway 등은 $PORT 를 주입한다 → 그 포트로 리슨, 없으면 8000(로컬 compose).
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s \
  CMD python -c "import os,urllib.request,sys; p=os.getenv('PORT','8000'); sys.exit(0 if urllib.request.urlopen(f'http://localhost:{p}/health').status==200 else 1)"

CMD ["sh", "-c", "uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}"]
