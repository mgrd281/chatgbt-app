import SwiftUI

struct ChatView: View {
    @ObservedObject var viewModel: ChatViewModel
    @State private var inputText: String = ""
    @FocusState private var isInputFocused: Bool
    
    var body: some View {
        VStack(spacing: 0) {
            // Chat Area
            ScrollViewReader { proxy in
                ScrollView {
                    LazyVStack(spacing: 12) {
                        if let session = viewModel.currentSession {
                            ForEach(session.messages) { message in
                                MessageBubble(message: message)
                                    .id(message.id)
                            }
                        }
                        
                        if viewModel.isLoading {
                            HStack {
                                Spacer()
                                ProgressView()
                                    .padding()
                                    .background(Color.gray.opacity(0.1))
                                    .clipShape(Circle())
                                Spacer()
                            }
                            .padding(.top, 10)
                        }
                        
                        // Invisible spacer to scroll to
                        Color.clear
                            .frame(height: 1)
                            .id("bottom")
                    }
                    .padding()
                }
                .onChange(of: viewModel.currentSession?.messages.count) { _ in
                    withAnimation {
                        proxy.scrollTo("bottom", anchor: .bottom)
                    }
                }
                .onChange(of: viewModel.isLoading) { loading in
                    if loading {
                        withAnimation {
                            proxy.scrollTo("bottom", anchor: .bottom)
                        }
                    }
                }
            }
            
            // Input Area
            VStack(spacing: 0) {
                Divider()
                HStack(alignment: .bottom) {
                    TextField("Nachricht...", text: $inputText, axis: .vertical)
                        .padding(10)
                        .background(Color.gray.opacity(0.1))
                        .cornerRadius(20)
                        .lineLimit(1...5)
                        .focused($isInputFocused)
                    
                    Button(action: sendMessage) {
                        Image(systemName: "arrow.up.circle.fill")
                            .resizable()
                            .frame(width: 32, height: 32)
                            .foregroundColor(inputText.isEmpty ? .gray : .blue)
                    }
                    .disabled(inputText.isEmpty || viewModel.isLoading)
                    .padding(.bottom, 2)
                }
                .padding()
                .background(Color.primary.colorInvert().opacity(0.05)) // Adaptive background
            }
        }
        .navigationTitle(viewModel.currentSession?.title ?? "Chat")
        #if os(iOS)
        .navigationBarTitleDisplayMode(.inline)
        #endif
        .alert(item: Binding<String?>(
            get: { viewModel.errorMessage },
            set: { viewModel.errorMessage = $0 }
        )) { error in
            Alert(title: Text("Fehler"), message: Text(error), dismissButton: .default(Text("OK")))
        }
    }
    
    func sendMessage() {
        viewModel.sendMessage(inputText)
        inputText = ""
    }
}

// Helper for Alert with String
extension String: Identifiable {
    public var id: String { self }
}

struct MessageBubble: View {
    let message: Message
    
    var isUser: Bool {
        message.role == .user
    }
    
    var body: some View {
        HStack(alignment: .bottom) {
            if isUser { Spacer() }
            
            VStack(alignment: isUser ? .trailing : .leading) {
                Text(.init(message.content)) // Markdown support
                    .padding(12)
                    .background(isUser ? Color.blue : Color.gray.opacity(0.2))
                    .foregroundColor(isUser ? .white : .primary)
                    .cornerRadius(16)
            }
            .frame(maxWidth: 400, alignment: isUser ? .trailing : .leading) // Fixed max width for simplicity
            
            if !isUser { Spacer() }
        }
    }
}
