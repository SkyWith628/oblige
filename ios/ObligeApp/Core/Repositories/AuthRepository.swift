import Foundation
import Supabase

final class AuthRepository {
    private let client = SupabaseClient.shared

    func signIn(email: String, password: String) async throws -> Profile {
        let session = try await client.auth.signIn(email: email, password: password)
        return try await fetchProfile(userId: session.user.id)
    }

    func signUp(email: String, password: String, name: String) async throws -> Profile {
        let response = try await client.auth.signUp(
            email: email,
            password: password,
            data: ["name": .string(name)]
        )
        let user = response.session?.user ?? response.user
        // DB 트리거가 profile을 생성하지 않은 경우 직접 삽입 시도
        struct ProfileInsert: Encodable {
            let id: String; let name: String; let role: String
            let grade: String; let point: Int; let bottle_return_count: Int
            let is_active: Bool
        }
        _ = try? await client.from("profiles")
            .upsert(ProfileInsert(
                id: user.id.uuidString, name: name, role: "customer",
                grade: "Seed", point: 0, bottle_return_count: 0, is_active: true
            ))
            .execute()
        try await Task.sleep(nanoseconds: 800_000_000)
        // DB 조회 실패 시 로컬 Profile 반환
        if let profile = try? await fetchProfile(userId: user.id) {
            return profile
        }
        return Profile(
            id: user.id, name: name, phone: nil, role: "customer",
            grade: "Seed", point: 0, bottleReturnCount: 0,
            isActive: true, createdAt: Date()
        )
    }

    func signOut() async throws {
        try await client.auth.signOut()
    }

    func currentSession() async -> Profile? {
        guard let userId = try? await client.auth.session.user.id else { return nil }
        return try? await fetchProfile(userId: userId)
    }

    func fetchProfile(userId: UUID) async throws -> Profile {
        let profiles: [Profile] = try await client.from("profiles")
            .select()
            .eq("id", value: userId.uuidString)
            .execute()
            .value
        guard let profile = profiles.first else {
            throw AppError.signUpFailed
        }
        return profile
    }

    enum AppError: LocalizedError {
        case signUpFailed
        var errorDescription: String? { "회원가입에 실패했습니다." }
    }
}
