import Foundation
import SwiftUI

@MainActor
class ChatViewModel: ObservableObject {
    @Published var sessions: [ChatSession] = []
    @Published var currentSessionId: UUID?
    @Published var isLoading: Bool = false
    @Published var errorMessage: String?
    
    private let saveKey = "saved_chat_sessions"
    private let apiKeyService = "com.myapp.openai.apikey"
    private let apiKeyAccount = "user_api_key"
    
    init() {
        loadSessions()
        if sessions.isEmpty {
            createNewSession()
        }
    }
    
    var currentSession: ChatSession? {
        get {
            sessions.first(where: { $0.id == currentSessionId })
        }
        set {
            if let newValue = newValue, let index = sessions.firstIndex(where: { $0.id == newValue.id }) {
                sessions[index] = newValue
            }
        }
    }
    
    func createNewSession() {
        let newSession = ChatSession(title: "Neuer Chat", messages: [])
        sessions.insert(newSession, at: 0)
        currentSessionId = newSession.id
        saveSessions()
    }
    
    func deleteSession(id: UUID) {
        sessions.removeAll(where: { $0.id == id })
        if currentSessionId == id {
            currentSessionId = sessions.first?.id
        }
        if sessions.isEmpty {
            createNewSession()
        }
        saveSessions()
    }
    
    func sendMessage(_ text: String) {
        guard !text.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty else { return }
        let apiKey = getApiKey()
        
        if apiKey.isEmpty {
            errorMessage = "Bitte hinterlegen Sie erst einen API-Key in den Einstellungen."
            return
        }
        
        guard var session = currentSession else { return }
        
        let userMessage = Message(role: .user, content: text)
        session.messages.append(userMessage)
        
        // Update title if it's the first message
        if session.messages.count == 1 {
            session.title = String(text.prefix(30))
        }
        
        // Update local state immediately
        self.currentSession = session
        saveSessions()
        
        isLoading = true
        errorMessage = nil
        
        Task {
            do {
                let responseContent = try await APIService.shared.sendMessage(messages: session.messages, apiKey: apiKey)
                let assistantMessage = Message(role: .assistant, content: responseContent)
                
                // Re-fetch session in case it changed (though we are on MainActor)
                if var updatedSession = self.currentSession {
                    updatedSession.messages.append(assistantMessage)
                    self.currentSession = updatedSession
                    self.saveSessions()
                }
            } catch {
                self.errorMessage = error.localizedDescription
            }
            self.isLoading = false
        }
    }
    
    // Persistence
    func saveSessions() {
        if let data = try? JSONEncoder().encode(sessions) {
            UserDefaults.standard.set(data, forKey: saveKey)
        }
    }
    
    func loadSessions() {
        if let data = UserDefaults.standard.data(forKey: saveKey),
           let decoded = try? JSONDecoder().decode([ChatSession].self, from: data) {
            sessions = decoded
        }
    }
    
    // API Key Management
    func saveApiKey(_ key: String) {
        SecureStore.shared.save(key, service: apiKeyService, account: apiKeyAccount)
    }
    
    func getApiKey() -> String {
        let storedKey = SecureStore.shared.read(service: apiKeyService, account: apiKeyAccount)
        if let key = storedKey, !key.isEmpty {
            return key
        }
        return "" // Enter your API Key here
    }
}
