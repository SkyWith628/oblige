import Foundation

struct Category: Codable, Identifiable {
    let id: Int
    var name: String
    var sortOrder: Int

    enum CodingKeys: String, CodingKey {
        case id, name
        case sortOrder = "sort_order"
    }
}

struct Product: Codable, Identifiable {
    let id: Int
    var categoryId: Int
    var name: String
    var price: Int
    var stock: Int
    var description: String?
    var ingredients: String?
    var isVegan: Bool
    var isRefillable: Bool
    var returnPoint: Int
    var earnPoint: Int
    var isActive: Bool
    var images: [ProductImage]?

    enum CodingKeys: String, CodingKey {
        case id, name, price, stock, description, ingredients
        case categoryId = "category_id"
        case isVegan = "is_vegan"
        case isRefillable = "is_refillable"
        case returnPoint = "return_point"
        case earnPoint = "earn_point"
        case isActive = "is_active"
        case images = "product_images"
    }

    var mainImageURL: URL? {
        let img = images?.first(where: { $0.isMain }) ?? images?.first
        return img.flatMap { URL(string: $0.imageUrl) }
    }

    var formattedPrice: String {
        let f = NumberFormatter()
        f.numberStyle = .decimal
        return (f.string(from: NSNumber(value: price)) ?? "\(price)") + "원"
    }
}

struct ProductImage: Codable, Identifiable {
    let id: Int
    var productId: Int
    var imageUrl: String
    var isMain: Bool
    var sortOrder: Int

    enum CodingKeys: String, CodingKey {
        case id
        case productId = "product_id"
        case imageUrl = "image_url"
        case isMain = "is_main"
        case sortOrder = "sort_order"
    }
}

struct CartItem: Codable, Identifiable {
    let id: Int
    var userId: UUID
    var productId: Int
    var quantity: Int
    var product: Product?

    enum CodingKeys: String, CodingKey {
        case id
        case userId = "user_id"
        case productId = "product_id"
        case quantity
        case product = "products"
    }
}
