import Foundation

enum APIError: Error, LocalizedError {
    case invalidURL
    case noData
    case decodingError
    case serverError(String)
    case unauthorized
    case unknown
    
    var errorDescription: String? {
        switch self {
        case .invalidURL: return "Ungültige URL."
        case .noData: return "Keine Daten empfangen."
        case .decodingError: return "Fehler beim Verarbeiten der Antwort."
        case .serverError(let msg): return "Serverfehler: \(msg)"
        case .unauthorized: return "Ungültiger API-Key."
        case .unknown: return "Unbekannter Fehler."
        }
    }
}

class APIService {
    static let shared = APIService()
    private init() {}
    
    func sendMessage(messages: [Message], apiKey: String, model: String = "gpt-4-turbo") async throws -> String {
        guard let url = URL(string: "https://api.openai.com/v1/chat/completions") else {
            throw APIError.invalidURL
        }
        
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("Bearer \(apiKey)", forHTTPHeaderField: "Authorization")
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        
        let apiMessages = messages.map { ["role": $0.role.rawValue, "content": $0.content] }
        
        let body: [String: Any] = [
            "model": model,
            "messages": apiMessages
        ]
        
        request.httpBody = try JSONSerialization.data(withJSONObject: body)
        
        let (data, response) = try await URLSession.shared.data(for: request)
        
        guard let httpResponse = response as? HTTPURLResponse else {
            throw APIError.unknown
        }
        
        if httpResponse.statusCode == 401 {
            throw APIError.unauthorized
        }
        
        guard httpResponse.statusCode == 200 else {
            // Try to parse error message from body
            if let errorJson = try? JSONSerialization.jsonObject(with: data) as? [String: Any],
               let errorObj = errorJson["error"] as? [String: Any],
               let message = errorObj["message"] as? String {
                throw APIError.serverError(message)
            }
            throw APIError.serverError("Status Code: \(httpResponse.statusCode)")
        }
        
        // Parse Response
        struct OpenAIResponse: Decodable {
            struct Choice: Decodable {
                struct MessageContent: Decodable {
                    let content: String
                }
                let message: MessageContent
            }
            let choices: [Choice]
        }
        
        do {
            let result = try JSONDecoder().decode(OpenAIResponse.self, from: data)
            return result.choices.first?.message.content ?? ""
        } catch {
            throw APIError.decodingError
        }
    }
}
