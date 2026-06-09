import UIKit

extension UIColor {
    // ── Brand palette ─────────────────────────────────────────────────
    static let obligeInk   = UIColor(hex: "#111312")  // 기본 텍스트·버튼
    static let obligePaper = UIColor(hex: "#fbfaf4")  // 앱 배경
    static let obligeWhite = UIColor(hex: "#fffdf8")  // 카드 배경
    static let obligePink  = UIColor(hex: "#ed218a")  // 브랜드 핑크·포인트·액티브
    static let obligeLime  = UIColor(hex: "#c9ff3d")  // 세컨더리 CTA·뱃지
    static let obligeMint  = UIColor(hex: "#c6f2de")  // 포인트 배너·Leaf 카드
    static let obligeSky   = UIColor(hex: "#b8dcff")  // 스킨 태그·Sky 카드
    static let obligeClay  = UIColor(hex: "#e8ddd1")  // 보조 배경
    static let obligeNavy  = UIColor(hex: "#0D1240")  // 로고 네이비

    // Legacy aliases (기존 코드 호환)
    static let obligeGreen = UIColor.obligePink
    static let obligeBeige = UIColor.obligePaper

    // ── Convenience ───────────────────────────────────────────────────
    convenience init(hex: String) {
        var h = hex.trimmingCharacters(in: .alphanumerics.inverted)
        if h.count == 3 { h = h.map { "\($0)\($0)" }.joined() }
        var rgb: UInt64 = 0
        Scanner(string: h).scanHexInt64(&rgb)
        self.init(
            red:   CGFloat((rgb >> 16) & 0xFF) / 255,
            green: CGFloat((rgb >>  8) & 0xFF) / 255,
            blue:  CGFloat( rgb        & 0xFF) / 255,
            alpha: 1
        )
    }
}
