"""Phase 4 통합 검증 — 실제 PostgreSQL 대상 거래 흐름 테스트.

실행: api 디렉토리에서
    .venv\\Scripts\\python.exe scripts\\verify_phase4.py
(PostgreSQL 이 DATABASE_URL 로 떠 있고 schema.sql+seed.sql 적용돼 있어야 함)
"""
import sys
import uuid

from fastapi.testclient import TestClient

from app.core.db import SessionLocal
from app.main import app
from app.models import User

client = TestClient(app)
PASS, FAIL = "PASS", "FAIL"
results = []


def check(name, cond, detail=""):
    results.append((name, cond))
    print(f"  [{PASS if cond else FAIL}] {name}" + (f" — {detail}" if detail else ""))
    return cond


def auth_header(token):
    return {"Authorization": f"Bearer {token}"}


def main():
    suffix = uuid.uuid4().hex[:8]
    buyer_email = f"buyer_{suffix}@test.com"
    admin_email = f"admin_{suffix}@test.com"

    print("\n=== 1. 회원가입 / 로그인 ===")
    r = client.post("/api/auth/register", json={"email": buyer_email, "password": "password123", "name": "구매자"})
    check("회원가입 201", r.status_code == 201, f"status={r.status_code}")
    r = client.post("/api/auth/login", data={"username": buyer_email, "password": "password123"})
    check("로그인 200 + 토큰", r.status_code == 200 and "access_token" in r.json())
    token = r.json()["access_token"]

    print("\n=== 2. 상품 조회 ===")
    r = client.get("/api/products")
    products = r.json()
    check("상품 목록 비어있지 않음", len(products) > 0, f"{len(products)}개")
    prod = products[0]
    pid, stock0, earn = prod["id"], prod["stock"], prod["earn_point"]
    print(f"  대상 상품: {prod['name']} (재고 {stock0}, 적립 {earn})")

    print("\n=== 3. 장바구니 → 주문 (재고 차감 · 적립) ===")
    qty = 2
    r = client.post("/api/cart", json={"product_id": pid, "quantity": qty}, headers=auth_header(token))
    check("장바구니 담기 201", r.status_code == 201)
    r = client.post("/api/orders", json={"items": [{"product_id": pid, "quantity": qty}], "used_point": 0}, headers=auth_header(token))
    check("주문 생성 201", r.status_code == 201, f"status={r.status_code} body={r.text[:120]}")
    order = r.json()
    order_id = order["id"]
    check("적립 포인트 = earn*qty", order["earned_point"] == earn * qty, f"{order['earned_point']} vs {earn*qty}")

    r = client.get(f"/api/products/{pid}")
    check("재고 차감됨", r.json()["stock"] == stock0 - qty, f"{r.json()['stock']} vs {stock0 - qty}")
    r = client.get("/api/auth/me", headers=auth_header(token))
    check("total_point = 적립분", r.json()["total_point"] == earn * qty, f"{r.json()['total_point']}")
    r = client.get("/api/cart", headers=auth_header(token))
    check("주문 후 장바구니 비워짐", len(r.json()) == 0)

    print("\n=== 4. 주문 취소 (재고 복원 · 적립 회수) ===")
    r = client.post(f"/api/orders/{order_id}/cancel", json={"reason": "테스트 취소"}, headers=auth_header(token))
    check("취소 200", r.status_code == 200, f"status={r.status_code} {r.text[:120]}")
    check("상태 CANCELLED", r.json()["order_status"] == "CANCELLED")
    r = client.get(f"/api/products/{pid}")
    check("재고 복원됨", r.json()["stock"] == stock0, f"{r.json()['stock']} vs {stock0}")
    r = client.get("/api/auth/me", headers=auth_header(token))
    check("적립 포인트 회수됨(0)", r.json()["total_point"] == 0, f"{r.json()['total_point']}")

    print("\n=== 5. 공병 반납 → 관리자 승인 (포인트 · 등급) ===")
    r = client.post("/api/returns", json={"bottle_count": 3, "return_method": "DELIVERY", "photo_urls": ["http://x/1.jpg"], "ai_detection": {"counts": {"토너": 3}}}, headers=auth_header(token))
    check("반납 신청 201", r.status_code == 201, f"status={r.status_code}")
    return_id = r.json()["id"]

    # 관리자 계정 생성 + role 승격(직접 DB)
    client.post("/api/auth/register", json={"email": admin_email, "password": "password123", "name": "관리자"})
    with SessionLocal() as db:
        admin = db.query(User).filter(User.email == admin_email).first()
        admin.role = "admin"
        db.commit()
    r = client.post("/api/auth/login", data={"username": admin_email, "password": "password123"})
    admin_token = r.json()["access_token"]

    # REQUESTED → INSPECTING → APPROVED
    r = client.patch(f"/api/returns/{return_id}/status", json={"target_status": "INSPECTING"}, headers=auth_header(admin_token))
    check("INSPECTING 전이 200", r.status_code == 200, f"{r.status_code} {r.text[:100]}")
    r = client.patch(f"/api/returns/{return_id}/status", json={"target_status": "APPROVED"}, headers=auth_header(admin_token))
    check("APPROVED 전이 200", r.status_code == 200, f"{r.status_code} {r.text[:100]}")
    check("승인 포인트 = 3*500", r.json()["approved_point"] == 1500, f"{r.json()['approved_point']}")

    r = client.get("/api/auth/me", headers=auth_header(token))
    me = r.json()
    check("반납 포인트 지급됨(1500)", me["total_point"] == 1500, f"{me['total_point']}")
    check("누적 반납 3 → 등급 Leaf", me["grade"] == "Leaf", f"grade={me['grade']}")

    print("\n=== 6. 멱등성 / 상태전이 가드 ===")
    r = client.patch(f"/api/returns/{return_id}/status", json={"target_status": "APPROVED"}, headers=auth_header(admin_token))
    check("이미 APPROVED → 재승인 거부(409)", r.status_code == 409, f"status={r.status_code}")

    r = client.get("/api/points", headers=auth_header(token))
    check("포인트 원장 기록 존재", len(r.json()) >= 1, f"{len(r.json())}건")

    print("\n=== 권한 검사 ===")
    r = client.patch(f"/api/returns/{return_id}/status", json={"target_status": "REJECTED"}, headers=auth_header(token))
    check("일반 사용자 상태변경 거부(403)", r.status_code == 403, f"status={r.status_code}")

    passed = sum(1 for _, c in results if c)
    print(f"\n{'='*50}\n결과: {passed}/{len(results)} 통과")
    return 0 if passed == len(results) else 1


if __name__ == "__main__":
    sys.exit(main())
