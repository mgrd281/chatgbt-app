import SwiftUI

struct ContentView: View {
    @StateObject private var viewModel = ChatViewModel()
    @State private var showSettings = false
    @AppStorage("isLoggedIn") private var isLoggedIn = false
    
    var body: some View {
        if isLoggedIn {
            NavigationSplitView {
                List(selection: $viewModel.currentSessionId) {
                    ForEach(viewModel.sessions) { session in
                        NavigationLink(value: session.id) {
                            VStack(alignment: .leading) {
                                Text(session.title)
                                    .font(.headline)
                                Text(session.lastModified, style: .date)
                                    .font(.caption)
                                    .foregroundStyle(.secondary)
                            }
                        }
                    }
                    .onDelete { indexSet in
                        indexSet.forEach { index in
                            let session = viewModel.sessions[index]
                            viewModel.deleteSession(id: session.id)
                        }
                    }
                }
                .navigationTitle("Verlauf")
                .toolbar {
                    ToolbarItem(placement: .primaryAction) {
                        Button(action: { viewModel.createNewSession() }) {
                            Image(systemName: "square.and.pencil")
                        }
                    }
                    ToolbarItem(placement: .cancellationAction) {
                        Button(action: { showSettings = true }) {
                            Image(systemName: "gear")
                        }
                    }
                    ToolbarItem(placement: .bottomBar) {
                        Button("Logout") {
                            isLoggedIn = false
                        }
                        .font(.caption)
                        .foregroundStyle(.red)
                    }
                }
            } detail: {
                if viewModel.currentSession != nil {
                    ChatView(viewModel: viewModel)
                } else {
                    Text("Wähle einen Chat oder starte einen neuen.")
                        .foregroundStyle(.secondary)
                }
            }
            .sheet(isPresented: $showSettings) {
                SettingsView(viewModel: viewModel)
            }
        } else {
            LoginView(isLoggedIn: $isLoggedIn)
        }
    }
}
