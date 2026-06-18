"use client";
// 마이페이지 모달 — 구 index.html 의 renderMypage() 디자인을 그대로 이식.
// 열릴 때 Server Action(getMypageData)으로 인증 데이터를 가져온다.
import { useEffect, useState } from "react";
import { getMypageData, logoutAction, type MypageData } from "@/app/actions/auth";

const GRADE_EMOJI: Record<string, string> = {
  Seed: "🌱",
  Sprout: "🌿",
  Leaf: "🍃",
  Tree: "🌳",
  Forest: "🌲",
  Gold: "🏆",
};

const num = (n: number) => n.toLocaleString("ko-KR");

export default function MypageModal({
  open,
  onClose,
  onLogout,
}: {
  open: boolean;
  onClose: () => void;
  onLogout: () => void;
}) {
  const [data, setData] = useState<MypageData | null>(null);
  const [status, setStatus] = useState<"idle" | "done">("idle");

  useEffect(() => {
    if (!open) return;
    let active = true;
    // setState는 async 콜백에서만 — effect 내 동기 setState 회피
    getMypageData().then((d) => {
      if (!active) return;
      setData(d);
      setStatus("done");
    });
    return () => {
      active = false;
    };
  }, [open]);

  const loading = open && status === "idle";

  async function handleLogout() {
    await logoutAction();
    onLogout();
  }

  const u = data?.user;
  const returnsCount = u?.bottle_return_count ?? 0;
  const nextAt =
    returnsCount < 3 ? 3 : returnsCount < 7 ? 7 : returnsCount < 15 ? 15 : null;
  const progress = nextAt ? Math.min(100, Math.round((returnsCount / nextAt) * 100)) : 100;
  const plastic = (returnsCount * 0.05).toFixed(2);
  const co2 = (returnsCount * 0.12).toFixed(2);

  return (
    <div
      className={`overlay${open ? " open" : ""}`}
      onClick={onClose}
      aria-hidden={!open}
    >
      <div className="modal modal-md" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose} aria-label="닫기">
          ×
        </button>
        <div className="mypage-body">
          {loading || !u ? (
            <p className="empty-state">
              <span className="icon">⏳</span>
              {loading ? "불러오는 중…" : "로그인이 필요합니다."}
            </p>
          ) : (
            <>
              <div className="mp-header">
                <div className="mp-avatar">{GRADE_EMOJI[u.grade] ?? "🌱"}</div>
                <div>
                  <div className="mp-name">{u.name}</div>
                  <div className="mp-grade">
                    {GRADE_EMOJI[u.grade] ?? "🌱"} {u.grade} · {u.email}
                  </div>
                </div>
                <button className="mp-logout" onClick={handleLogout}>
                  로그아웃
                </button>
              </div>

              <div className="mp-stats">
                <div className="mp-stat">
                  <div className="mp-stat-num" style={{ color: "var(--pink)" }}>
                    {num(u.total_point)}
                  </div>
                  <div className="mp-stat-lbl">보유 포인트</div>
                </div>
                <div className="mp-stat">
                  <div className="mp-stat-num">{returnsCount}</div>
                  <div className="mp-stat-lbl">공병 반납 수</div>
                </div>
                <div className="mp-stat">
                  <div className="mp-stat-num">{plastic}kg</div>
                  <div className="mp-stat-lbl">플라스틱 절감</div>
                </div>
              </div>

              {nextAt ? (
                <>
                  <div style={{ fontSize: 13, color: "var(--muted)", marginBottom: 6 }}>
                    다음 등급까지 공병 <strong>{nextAt - returnsCount}개</strong> 더 반납하면
                    업그레이드!
                  </div>
                  <div className="esg-bar">
                    <div className="esg-fill" style={{ width: `${progress}%` }} />
                  </div>
                  <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 20 }}>
                    {returnsCount} / {nextAt} 개
                  </div>
                </>
              ) : (
                <p
                  style={{
                    fontSize: 13,
                    color: "var(--success)",
                    fontWeight: 700,
                    marginBottom: 20,
                  }}
                >
                  🌲 최고 등급 Forest 달성!
                </p>
              )}

              <div className="mp-section-title">내 ESG 임팩트 🌍</div>
              <div
                style={{
                  background: "var(--off)",
                  borderRadius: 8,
                  padding: 20,
                  fontSize: 14,
                  lineHeight: 1.8,
                  marginBottom: 8,
                }}
              >
                공병 반납 <strong>{returnsCount}개</strong> · 플라스틱{" "}
                <strong>{plastic}kg</strong> 절감 · CO₂ <strong>{co2}kg</strong> 절감
              </div>

              <div className="mp-section-title" style={{ marginTop: 28 }}>
                최근 공병 반납
              </div>
              {data.returns.length ? (
                data.returns.slice(0, 5).map((r) => (
                  <div key={r.id} className="mp-list-row">
                    <div>
                      <strong>{r.return_number}</strong>
                      <br />
                      <span style={{ color: "var(--muted)" }}>
                        {r.created_at.slice(0, 10)} · {r.return_status}
                      </span>
                    </div>
                    <strong style={{ color: "var(--pink)" }}>
                      {num(r.approved_point)}P
                    </strong>
                  </div>
                ))
              ) : (
                <p style={{ fontSize: 13, color: "var(--muted)" }}>반납 내역이 없습니다.</p>
              )}

              <div className="mp-section-title" style={{ marginTop: 28 }}>
                최근 포인트 내역
              </div>
              {data.points.length ? (
                data.points.slice(0, 5).map((p) => (
                  <div key={p.id} className="mp-list-row">
                    <div>
                      <strong>{p.reason ?? p.tx_type}</strong>
                      <br />
                      <span style={{ color: "var(--muted)" }}>
                        {p.created_at.slice(0, 10)}
                      </span>
                    </div>
                    <strong
                      style={{ color: p.point_change >= 0 ? "var(--success)" : "var(--pink)" }}
                    >
                      {p.point_change >= 0 ? "+" : ""}
                      {num(p.point_change)}P
                    </strong>
                  </div>
                ))
              ) : (
                <p style={{ fontSize: 13, color: "var(--muted)" }}>
                  포인트 내역이 없습니다.
                </p>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
