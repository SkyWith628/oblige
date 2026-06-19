// W4 수거함/매장 거점 — 백엔드 locations 엔드포인트가 아직 없어 정적 데이터로 제공.
// (추후 admin E5 에서 등록한 거점이 이 목록을 대체할 예정.)
export type LocationType = "플래그십" | "무인 수거함" | "팝업";

export interface StoreLocation {
  id: string;
  name: string;
  type: LocationType;
  distanceKm: number;
  address: string;
  hours: string;
  /** 무인 수거함 적재율(%) — E5 어드민용 placeholder(백엔드 미연동). */
  fillRate: number;
}

export const locations: StoreLocation[] = [
  {
    id: "seongsu",
    name: "성수 플래그십 스토어",
    type: "플래그십",
    distanceKm: 0.4,
    address: "서울 성동구 연무장길",
    hours: "매일 11–20시",
    fillRate: 42,
  },
  {
    id: "gangnam-a",
    name: "강남 무인 수거함 A",
    type: "무인 수거함",
    distanceKm: 1.1,
    address: "서울 강남구 테헤란로",
    hours: "24시간",
    fillRate: 88,
  },
  {
    id: "hongdae",
    name: "홍대 팝업 스토어",
    type: "팝업",
    distanceKm: 2.3,
    address: "서울 마포구 양화로",
    hours: "12–21시",
    fillRate: 25,
  },
  {
    id: "yeouido-b",
    name: "여의도 무인 수거함 B",
    type: "무인 수거함",
    distanceKm: 3.0,
    address: "서울 영등포구 국제금융로",
    hours: "24시간",
    fillRate: 100,
  },
  {
    id: "jamsil",
    name: "잠실 플래그십 스토어",
    type: "플래그십",
    distanceKm: 4.2,
    address: "서울 송파구 올림픽로",
    hours: "매일 10–21시",
    fillRate: 38,
  },
  {
    id: "yongsan-c",
    name: "용산 무인 수거함 C",
    type: "무인 수거함",
    distanceKm: 5.1,
    address: "서울 용산구 한강대로",
    hours: "24시간",
    fillRate: 67,
  },
];
