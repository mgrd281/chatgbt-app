import Foundation

enum MessageRole: String, Codable {
    case system
    case user
    case assistant
}

struct Message: Identifiable, Codable, Equatable {
    var id: UUID = UUID()
    var role: MessageRole
    var content: String
    var timestamp: Date = Date()
}

struct ChatSession: Identifiable, Codable, Equatable {
    var id: UUID = UUID()
    var title: String
    var messages: [Message]
    var lastModified: Date = Date()
}
