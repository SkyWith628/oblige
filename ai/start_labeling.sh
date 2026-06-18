#!/bin/bash

PROJECT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$PROJECT_DIR"

echo "=============================="
echo "  공병 라벨링 서버 시작"
echo "=============================="

# Flask 서버 백그라운드 실행
python3 main.py label &
FLASK_PID=$!
echo "Flask 서버 시작 (PID: $FLASK_PID)"
sleep 2

# ngrok으로 외부 공개
echo ""
echo "ngrok 터널 시작 중..."
echo "아래 URL을 팀원들에게 공유하세요."
echo "=============================="
ngrok http 5000

# 종료 시 Flask도 함께 종료
kill $FLASK_PID
