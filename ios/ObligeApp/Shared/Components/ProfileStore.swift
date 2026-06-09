import Foundation

/// 로그인한 사용자 프로필을 앱 전체에서 공유하는 간단한 싱글톤
final class ProfileStore {
    static let shared = ProfileStore()
    private init() {}
    var profile: Profile?
}
