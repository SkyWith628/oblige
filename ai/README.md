# OBLIGE AI — 공병 인식 모델

YOLOv8 기반 화장품 공병 탐지. 사용자가 올린 사진에서 공병 종류·개수를 판정해
반납 포인트 지급에 사용한다. (`cosmetic-agent` 프로젝트에서 이주)

## 구성

| 경로 | 역할 |
|---|---|
| `main.py` | 파이프라인 CLI (crawl → label → prepare → train) |
| `crawler/` | Bing/Naver 이미지 자동 수집 + 중복/불량 제거 |
| `labeler/` | 라벨링 UI (Flask, `http://localhost:5000`) |
| `dataset/` | 공병 데이터셋 (5클래스: 토너·앰플·크림·선크림·에센스) |
| `runs/` | 학습 결과 (가중치·지표·플롯) |

## ⚠️ Python 버전

PyTorch/ultralytics는 시스템 Python 3.14를 아직 지원하지 않을 수 있다.
**Python 3.11 또는 3.12 가상환경**을 따로 만들어 사용한다.

```bash
# Python 3.11 기준 (py 런처 사용)
py -3.11 -m venv .venv
.venv\Scripts\activate          # Windows
pip install -r requirements.txt

# CUDA(GPU) PyTorch 설치 — RTX 3070
pip install torch torchvision --index-url https://download.pytorch.org/whl/cu121
```

## 학습 (로컬 GPU — RTX 3070)

```bash
python main.py crawl --count 200   # 1. 데이터 수집
python main.py label               # 2. 라벨링 UI
python main.py prepare             # 3. train/val 분할
python main.py train --epochs 100  # 4. 학습 (device=0 자동, GPU 사용)
```

학습 산출물: `runs/detect/cosmetic_bottle/weights/best.pt`

## 서빙

운영에서는 GPU 없이 **CPU로 추론**한다. 학습된 `best.pt`만 배포해
FastAPI(`api/`)의 `/api/ai/detect-bottle` 라우터가 싱글턴으로 1회 로드한다.

## 현재 성능 (개선 필요)

mAP50 약 0.23~0.33 — PoC 수준. 데이터 증강 + 에폭↑ + GPU 재학습으로 개선 예정.
