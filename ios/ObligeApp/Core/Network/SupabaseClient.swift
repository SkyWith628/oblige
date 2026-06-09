import Foundation
import Supabase

final class SupabaseClient {
    static let shared = SupabaseClient()
    private(set) var client: Supabase.SupabaseClient!

    private init() {}

    func configure() {
        let url = URL(string: "https://xknrqwwvvewvvwprsiqu.supabase.co")!
        let key = "sb_publishable_JvPDona-gKS0gGQrvNclvA_iJmg-HEO"
        client = Supabase.SupabaseClient(supabaseURL: url, supabaseKey: key)
    }

    var auth: AuthClient { client.auth }
    func from(_ table: String) -> PostgrestQueryBuilder { client.from(table) }
    var storage: SupabaseStorageClient { client.storage }
}
