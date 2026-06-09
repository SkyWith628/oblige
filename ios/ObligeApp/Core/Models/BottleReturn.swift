import Foundation

struct BottleReturn: Codable, Identifiable {
    let id: Int
    var returnNumber: String
    var userId: UUID
    var bottleCount: Int
    var bottleType: String
    var returnMethod: ReturnMethod
    var photoUrls: [String]
    var returnStatus: ReturnStatus
    var approvedPoint: Int
    var createdAt: Date

    enum CodingKeys: String, CodingKey {
        case id
        case returnNumber = "return_number"
        case userId = "user_id"
        case bottleCount = "bottle_count"
        case bottleType = "bottle_type"
        case returnMethod = "return_method"
        case photoUrls = "photo_urls"
        case returnStatus = "return_status"
        case approvedPoint = "approved_point"
        case createdAt = "created_at"
    }

    enum ReturnMethod: String, Codable, CaseIterable {
        case delivery = "DELIVERY"
        case offline  = "OFFLINE"
        var label: String { self == .delivery ? "택배 반납" : "오프라인 수거함" }
    }

    enum ReturnStatus: String, Codable {
        case received   = "신청접수"
        case inspecting = "검수중"
        case completed  = "포인트지급완료"
        case rejected   = "반려"
    }
}

struct PointLog: Codable, Identifiable {
    let id: Int
    var userId: UUID
    var pointChange: Int
    var balance: Int
    var logType: String
    var reason: String?
    var createdAt: Date

    enum CodingKeys: String, CodingKey {
        case id
        case userId = "user_id"
        case pointChange = "point_change"
        case balance
        case logType = "log_type"
        case reason
        case createdAt = "created_at"
    }
}
