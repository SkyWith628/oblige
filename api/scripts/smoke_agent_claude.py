"""Claude 반납 어시스턴트 스모크 테스트 — Postgres 없이 구독 인증 + 도구 루프만 검증.

무엇을 확인하나:
  1) claude-agent-sdk 가 구독 인증(Claude Code CLI 로그인)으로 동작하는가
  2) Claude 가 한국어로 답하며 우리 도구(get_membership_status / create_return)를 호출하는가
DB 의존 도구는 가짜 데이터로 대체하므로 Postgres·YOLO 가 필요 없다.

전제:
  - 본인 터미널에서 Claude Code CLI 구독 로그인:  claude   → /login
  - ANTHROPIC_API_KEY 는 비어 있어야 구독을 쓴다 (설정돼 있으면 API 과금)

실행:
  cd ~/dev/oblige/api
  .venv/bin/python scripts/smoke_agent_claude.py
"""
import asyncio
import os
import sys
from types import SimpleNamespace

# api/ 를 import 경로에 추가 (어느 cwd 에서 실행하든 `app` 패키지 인식)
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import app.services.agent_claude as ac  # noqa: E402

# ── DB 의존 도구를 가짜 데이터로 대체 (Postgres 불필요) ──────────────────
# 핸들러가 agent_claude 모듈 전역의 이름을 ToolContext 로 호출하므로 여기서 덮어쓴다.
def _fake_detect(ctx):
    ctx.last_detection = {"detections": [], "counts": {"토너": 3}, "total": 3}
    return ctx.last_detection


ac.detect_bottle_impl = _fake_detect
ac.membership_impl = lambda ctx: {
    "grade": "Seed", "total_point": 1500, "bottle_return_count": 2,
    "next_grade": "Leaf", "bottles_to_next_grade": 1,
}
ac.create_return_impl = lambda ctx, n: {
    "return_number": "RT-TEST-001", "bottle_count": int(n),
    "status": "REQUESTED", "verified": True, "message": "반납 신청 완료(테스트).",
}

fake_user = SimpleNamespace(
    name="해랑", grade="Seed", total_point=1500, bottle_return_count=2
)

MESSAGES = [
    "내 등급이랑 다음 등급까지 공병 몇 개 남았는지 알려줘",
    "그럼 공병 3개 반납 신청해줘",
]


async def main() -> None:
    print("=" * 60, flush=True)
    print("Claude 에이전트 스모크 테스트 (구독 인증, DB 없음)", flush=True)
    print("=" * 60, flush=True)
    history: list[dict] = []
    for msg in MESSAGES:
        print(f"\n🧑 사용자: {msg}", flush=True)
        print("   ⏳ Claude 호출 중... (첫 실행은 CLI 콜드스타트로 30~90초 걸릴 수 있어요)", flush=True)
        try:
            res = await asyncio.wait_for(
                ac.run_chat(db=None, user=fake_user, message=msg, history=history),
                timeout=180,
            )
        except asyncio.TimeoutError:
            print("⏰ 180초 초과 — Claude CLI 응답이 없습니다.", flush=True)
            print('   → 먼저 `claude -p "안녕"` 이 단독으로 빨리 답하는지 확인하세요.', flush=True)
            return
        except ac.AgentUnavailable as e:
            print(f"❌ AgentUnavailable: {e}", flush=True)
            return
        reply = res["reply"]
        print(f"🤖 어시스턴트: {reply}", flush=True)
        if res["actions"]:
            print(f"   🔧 호출된 도구: {[a['tool'] for a in res['actions']]}", flush=True)
        # 다음 턴을 위해 대화 누적 (텍스트 전용)
        history.append({"role": "user", "content": msg})
        history.append({"role": "assistant", "content": reply})

    print("\n✅ 스모크 테스트 완료 — Claude 가 구독으로 도구 루프를 구동했습니다.", flush=True)


if __name__ == "__main__":
    asyncio.run(main())
