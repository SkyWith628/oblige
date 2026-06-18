"""공병 인식 추론 서비스.

- 모델은 싱글턴으로 1회만 로드한다 (요청마다 재로드 금지).
- ultralytics/torch 는 무거우므로 lazy import — 미설치 시 명확한 에러를 던진다.
"""
from collections import Counter
from functools import lru_cache

from ..core.config import settings

# dataset/dataset.yaml 의 클래스 인덱스 → 한글 라벨
CLASS_NAMES = {0: "토너", 1: "앰플", 2: "크림", 3: "선크림", 4: "에센스"}


class ModelUnavailable(RuntimeError):
    """ultralytics 미설치 또는 가중치 파일 부재."""


class BottleDetector:
    def __init__(self, model_path: str):
        try:
            from ultralytics import YOLO  # lazy: torch/ultralytics
        except ImportError as e:
            raise ModelUnavailable(
                "ultralytics 미설치 — `pip install ultralytics` 후 사용하세요"
            ) from e
        self.model = YOLO(model_path)

    def detect(self, image_path: str) -> dict:
        results = self.model.predict(image_path, verbose=False)
        detections = []
        for r in results:
            for box in r.boxes:
                cls_id = int(box.cls[0])
                detections.append(
                    {
                        "label": CLASS_NAMES.get(cls_id, str(cls_id)),
                        "confidence": round(float(box.conf[0]), 4),
                        "box": [round(float(v), 1) for v in box.xyxy[0].tolist()],
                    }
                )
        counts = dict(Counter(d["label"] for d in detections))
        return {"detections": detections, "counts": counts, "total": len(detections)}


@lru_cache(maxsize=1)
def get_detector() -> BottleDetector:
    """싱글턴 — 첫 호출에서만 모델 로드."""
    return BottleDetector(settings.model_path)
