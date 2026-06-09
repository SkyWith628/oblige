import UIKit
import Storage

final class BottleReturnRepository {
    private let client = SupabaseClient.shared

    func submitReturn(
        userId: UUID,
        bottleCount: Int,
        bottleType: String,
        returnMethod: BottleReturn.ReturnMethod,
        images: [UIImage]
    ) async throws -> BottleReturn {
        let photoUrls = try await uploadPhotos(images: images, userId: userId)
        struct Payload: Encodable {
            let user_id: String; let bottle_count: Int
            let bottle_type: String; let return_method: String; let photo_urls: [String]
        }
        return try await client.from("bottle_returns")
            .insert(Payload(user_id: userId.uuidString, bottle_count: bottleCount,
                            bottle_type: bottleType, return_method: returnMethod.rawValue,
                            photo_urls: photoUrls))
            .select().single().execute().value
    }

    func fetchReturns(userId: UUID) async throws -> [BottleReturn] {
        try await client.from("bottle_returns")
            .select()
            .eq("user_id", value: userId.uuidString)
            .order("created_at", ascending: false)
            .execute()
            .value
    }

    private func uploadPhotos(images: [UIImage], userId: UUID) async throws -> [String] {
        var urls: [String] = []
        for (i, image) in images.enumerated() {
            guard let data = image.jpegData(compressionQuality: 0.7) else { continue }
            let path = "returns/\(userId.uuidString)/\(UUID().uuidString)_\(i).jpg"
            _ = try await client.storage.from("returns")
                .upload(path, data: data, options: FileOptions(contentType: "image/jpeg"))
            let url = try client.storage.from("returns").getPublicURL(path: path)
            urls.append(url.absoluteString)
        }
        return urls
    }
}
