import SwiftUI

struct SettingsView: View {
    @State private var apiKey: String = ""
    @ObservedObject var viewModel: ChatViewModel
    @Environment(\.dismiss) var dismiss
    
    var body: some View {
        NavigationStack {
            Form {
                Section(header: Text("OpenAI API Configuration")) {
                    SecureField("API Key eingeben", text: $apiKey)
                        .textContentType(.password)
                        .autocorrectionDisabled()
                        .textInputAutocapitalization(.never)
                    
                    Button("Speichern") {
                        viewModel.saveApiKey(apiKey)
                        dismiss()
                    }
                    .disabled(apiKey.isEmpty)
                }
                
                Section(header: Text("Info")) {
                    Text("Der API-Key wird sicher im iOS Keychain gespeichert.")
                        .font(.caption)
                        .foregroundStyle(.secondary)
                }
            }
            .navigationTitle("Einstellungen")
            .onAppear {
                apiKey = viewModel.getApiKey()
            }
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Schließen") {
                        dismiss()
                    }
                }
            }
        }
    }
}
