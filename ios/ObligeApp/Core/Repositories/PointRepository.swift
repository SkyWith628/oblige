import Foundation

final class PointRepository {
    private let client = SupabaseClient.shared

    func fetchPointLogs(userId: UUID, limit: Int = 30) async throws -> [PointLog] {
        try await client.from("point_logs")
            .select()
            .eq("user_id", value: userId.uuidString)
            .order("created_at", ascending: false)
            .limit(limit)
            .execute()
            .value
    }
}
