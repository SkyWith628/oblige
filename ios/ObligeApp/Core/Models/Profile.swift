import Foundation

struct Profile: Codable, Identifiable {
    let id: UUID
    var name: String
    var phone: String?
    var role: String
    var grade: String
    var point: Int
    var bottleReturnCount: Int
    var isActive: Bool
    var createdAt: Date

    enum CodingKeys: String, CodingKey {
        case id, name, phone, role, grade, point
        case bottleReturnCount = "bottle_return_count"
        case isActive = "is_active"
        case createdAt = "created_at"
    }
}

struct GradeRule {
    let grade: String
    let icon: String
    let minReturnCount: Int
    let pointRate: Double
    let benefit: String

    static let all: [GradeRule] = [
        GradeRule(grade: "Seed",   icon: "🌱", minReturnCount: 0,  pointRate: 1.00, benefit: "기본 포인트 적립, 회원 전용 뉴스레터"),
        GradeRule(grade: "Leaf",   icon: "🍃", minReturnCount: 3,  pointRate: 1.10, benefit: "추가 포인트 +10%, 신제품 우선 구매"),
        GradeRule(grade: "Tree",   icon: "🌳", minReturnCount: 7,  pointRate: 1.20, benefit: "친환경 굿즈 제공, 포인트 +20%, 리필 할인 쿠폰"),
        GradeRule(grade: "Forest", icon: "🌲", minReturnCount: 15, pointRate: 1.30, benefit: "리필 무료 혜택, 한정 상품 우선 제공, 앰배서더 자격"),
    ]

    static func current(for profile: Profile) -> GradeRule {
        all.last(where: { $0.minReturnCount <= profile.bottleReturnCount }) ?? all[0]
    }

    static func next(for profile: Profile) -> GradeRule? {
        all.first(where: { $0.minReturnCount > profile.bottleReturnCount })
    }
}
