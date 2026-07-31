import Foundation

/// Thin Bearer-token client for /api/mobile/* routes, mirroring the fetch
/// pattern already verified against src/app/api/mobile/availability/route.ts.
/// All business logic (foursome membership, round status, admin checks)
/// stays server-side — this layer only attaches the token and decodes JSON.
struct APIClient {
    let authManager: AuthManager

    enum APIError: Error {
        case unauthenticated
        case server(status: Int, body: String)
    }

    func get<T: Decodable>(_ path: String) async throws -> T {
        try await send(path: path, method: "GET", body: nil as Data?)
    }

    func post<T: Decodable, Body: Encodable>(_ path: String, body: Body) async throws -> T {
        let data = try JSONEncoder().encode(body)
        return try await send(path: path, method: "POST", body: data)
    }

    private func send<T: Decodable>(path: String, method: String, body: Data?) async throws -> T {
        guard let token = await authManager.accessToken else {
            throw APIError.unauthenticated
        }

        var request = URLRequest(url: AppConfig.apiBaseURL.appendingPathComponent(path))
        request.httpMethod = method
        request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        if let body {
            request.httpBody = body
            request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        }

        let (data, response) = try await URLSession.shared.data(for: request)
        guard let http = response as? HTTPURLResponse, (200..<300).contains(http.statusCode) else {
            let status = (response as? HTTPURLResponse)?.statusCode ?? -1
            throw APIError.server(status: status, body: String(data: data, encoding: .utf8) ?? "")
        }

        let decoder = JSONDecoder()
        decoder.keyDecodingStrategy = .convertFromSnakeCase
        return try decoder.decode(T.self, from: data)
    }
}
