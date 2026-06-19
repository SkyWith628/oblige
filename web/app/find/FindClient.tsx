"use client";
// W4 수거함 찾기 — 검색 + 타입 필터 + 지도 placeholder + 거리순 리스트(핀 선택 하이라이트).
// 실 카카오맵은 NEXT_PUBLIC_KAKAO_MAP_KEY 발급 후 연동 예정.
import { useMemo, useState } from "react";
import { locations, type LocationType } from "@/lib/data/locations";
import styles from "./find.module.css";

const FILTERS: ("전체" | LocationType)[] = ["전체", "플래그십", "무인 수거함"];

export default function FindClient() {
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>("전체");
  const [selected, setSelected] = useState(locations[0].id);

  const list = useMemo(() => {
    const kw = q.trim();
    return locations
      .filter((l) => filter === "전체" || l.type === filter)
      .filter((l) => !kw || l.name.includes(kw) || l.address.includes(kw))
      .sort((a, b) => a.distanceKm - b.distanceKm);
  }, [q, filter]);

  return (
    <>
      <div className={styles.search}>
        <input
          className={styles.searchInput}
          placeholder="🔍 지역·매장명을 검색하세요"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <div className={styles.chips}>
          {FILTERS.map((f) => (
            <button
              key={f}
              className={`${styles.chip}${f === filter ? ` ${styles.chipOn}` : ""}`}
              onClick={() => setFilter(f)}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      <div className={styles.layout}>
        <div className={styles.map}>
          <div style={{ fontSize: 34 }}>🗺️</div>
          <div className={styles.mapTitle}>지도 영역 (카카오맵 임베드)</div>
          <p className={styles.mapNote}>
            카카오맵 키(NEXT_PUBLIC_KAKAO_MAP_KEY) 연동 시 실제 지도와 핀이
            표시됩니다. 지금은 우측 리스트에서 거점을 선택하세요.
          </p>
        </div>

        <div className={styles.list}>
          {list.map((l) => (
            <button
              key={l.id}
              className={`${styles.item}${l.id === selected ? ` ${styles.itemOn}` : ""}`}
              onClick={() => setSelected(l.id)}
            >
              <div className={styles.itemTop}>
                <span className={styles.itemName}>{l.name}</span>
                <span className={styles.dist}>{l.distanceKm.toFixed(1)}km</span>
              </div>
              <div className={styles.itemMeta}>
                {l.address} · {l.hours}
              </div>
              <span className={styles.badge}>{l.type}</span>
            </button>
          ))}
        </div>
      </div>
    </>
  );
}
