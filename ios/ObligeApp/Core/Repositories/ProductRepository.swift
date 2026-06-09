import Foundation

final class ProductRepository {
    private let client = SupabaseClient.shared

    func fetchCategories() async throws -> [Category] {
        try await client.from("categories").select().order("sort_order").execute().value
    }

    func fetchProducts(categoryId: Int? = nil) async throws -> [Product] {
        if let categoryId {
            return try await client.from("products")
                .select("*, product_images(*)")
                .eq("is_active", value: true)
                .eq("category_id", value: categoryId)
                .order("sort_order")
                .execute()
                .value
        } else {
            return try await client.from("products")
                .select("*, product_images(*)")
                .eq("is_active", value: true)
                .order("sort_order")
                .execute()
                .value
        }
    }

    func fetchProduct(id: Int) async throws -> Product {
        try await client.from("products")
            .select("*, product_images(*)")
            .eq("id", value: id)
            .single()
            .execute()
            .value
    }

    func fetchCartItems(userId: UUID) async throws -> [CartItem] {
        try await client.from("cart_items")
            .select("*, products(*, product_images(*))")
            .eq("user_id", value: userId.uuidString)
            .execute()
            .value
    }

    func addToCart(userId: UUID, productId: Int, quantity: Int = 1) async throws {
        struct Payload: Encodable {
            let user_id: String; let product_id: Int; let quantity: Int
        }
        try await client.from("cart_items")
            .upsert(Payload(user_id: userId.uuidString, product_id: productId, quantity: quantity))
            .execute()
    }

    func removeFromCart(itemId: Int) async throws {
        try await client.from("cart_items").delete().eq("id", value: itemId).execute()
    }
}
