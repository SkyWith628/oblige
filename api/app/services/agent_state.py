"""반납 어시스턴트 — 턴 사이 탐지 결과 보존 (C2 멀티턴 컨텍스트).

백엔드는 HTTP 요청마다 stateless 이므로, 1턴에서 detect_bottle 한 결과를
2턴(사진 없는 "응 신청해줘")에서도 쓰려면 서버측에 잠시 보관해야 한다.

흐름:
  detect_bottle(1턴) → run_chat 종료 시 remember_detection 으로 저장
  create_return(2턴) → run_chat 시작 시 recall_detection 으로 복원 → 검증
  반납 생성 성공     → ctx.last_detection = None (소비) → 다음 저장 때 캐시 제거 → 중복 방지

현재: 프로세스 내 메모리 캐시 (단일 워커 개발/데모용).
운영(다중 워커/오토스케일)에서는 Redis 등 외부 저장소로 교체 필요 (키·TTL 동일).
"""
import time

_TTL_SEC = 600  # 10분 — 오래된 탐지는 폐기 (다른 사진을 잘못 재사용하지 않도록)
_CACHE: dict[int, tuple[float, dict]] = {}  # user_id → (저장시각, detection)


def remember_detection(user_id: int | None, detection: dict | None) -> None:
    """탐지 결과를 사용자별로 저장. detection 이 falsy(소비됨)면 캐시에서 제거."""
    if user_id is None:
        return
    if not detection:
        _CACHE.pop(user_id, None)
        return
    _CACHE[user_id] = (time.time(), detection)


def recall_detection(user_id: int | None) -> dict | None:
    """저장된 탐지 결과 복원. 없거나 TTL 초과면 None."""
    if user_id is None:
        return None
    item = _CACHE.get(user_id)
    if not item:
        return None
    ts, det = item
    if time.time() - ts > _TTL_SEC:
        _CACHE.pop(user_id, None)
        return None
    return det
