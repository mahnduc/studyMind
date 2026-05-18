# Modular Agent Architecture
`Runtime` `Supervisor` `Executors` `Capabilities`
## Tổng quan
Agent triển khai local First, model llm sử dụng là api cảu groq: https://api.groq.com/openai/v1/chat/completions, thực hiên stream dữ liệu qua http post

Triển khai local first, sử dụng pglite + OPFS, NextJs Static (output: export)

## Cấu trúc thư mục
```structure folder
core/
├── agent/
│   ├── runtime/                         # Kernel điều phối trung tâm (xương sống)
│   │   ├── runtime.ts                   # AgentRuntime: orchestrator chính
│   │   ├── session.ts                   # ConversationSession: quản lý lịch sử hội thoại
│   │   ├── context.ts                   # RuntimeContext dùng xuyên suốt hệ thống
│   │   ├── event-emitter.ts             # Pub/Sub event nội bộ
│   │   └── types.ts                     # AgentState, ExecutionMode, RuntimeOptions
│   │
│   ├── capabilities/                    # Khai báo "năng lực" của agent
│   │   ├── definitions/
│   │   │   ├── direct/
│   │   │   │   ├── document-search.capability.ts
│   │   │   │   └── quiz-generation.capability.ts
│   │   │   │
│   │   │   ├── workflow/
│   │   │   │   └── study-session.capability.ts
│   │   │   │
│   │   │   └── reasoning/
│   │   │       └── complex-analysis.capability.ts
│   │   │
│   │   ├── registry.ts                  # CapabilityRegistry
│   │   ├── bootstrap.ts                 # Đăng ký toàn bộ capability
│   │   └── types.ts                     # CapabilityDefinition
│   │
│   ├── supervisor/                      # Chọn capability + execution mode
│   │   ├── supervisor.ts
│   │   ├── intent-classifier.ts
│   │   ├── capability-ranker.ts
│   │   ├── mode-selector.ts
│   │   └── prompt.ts
│   │
│   ├── executors/                       # Các engine thực thi
│   │   ├── executor.registry.ts
│   │   ├── direct-executor.ts
│   │   ├── reasoning-executor.ts
│   │   └── workflow-executor.ts
│   │
│   ├── providers/                       # Adapter cho LLM
│   │   ├── provider.interface.ts
│   │   ├── provider-router.ts
│   │   │
│   │   └── groq/
│   │       ├── groq.client.ts
│   │       ├── groq.stream.ts
│   │       └── types.ts
│   │
│   ├── tools/                           # Các công cụ mà LLM có thể gọi
│   │   ├── definitions/
│   │   │   ├── ask-user-confirmation/
│   │   │   │   └── tool.ts
│   │   │   │
│   │   │   ├── search-knowledge-base/
│   │   │   │   └── tool.ts             # Tra cứu tài liệu nội bộ (RAG)
│   │   │   │
│   │   │   ├── generate-quiz/
│   │   │   │   └── tool.ts             # Sinh câu hỏi trắc nghiệm
│   │   │   │
│   │   │   ├── save-quiz/
│   │   │   │   └── tool.ts             # Lưu bộ câu hỏi
│   │   │   │
│   │   │   └── load-document/
│   │   │       └── tool.ts             # Đọc nội dung tài liệu
│   │   │
│   │   ├── registry.ts
│   │   ├── bootstrap.ts
│   │   └── types.ts                     # ToolDefinition
│   │
│   ├── workflows/                       # Các luồng nhiều bước
│   │   ├── definitions/
│   │   │   ├── generate-quiz.workflow.ts
│   │   │   └── study-session.workflow.ts
│   │   │
│   │   ├── workflow-registry.ts
│   │   └── types.ts                     # WorkflowDefinition
│   │
│   ├── reasoning/                       # ReAct / multi-step reasoning
│   │   ├── reasoning-loop.ts
│   │   └── types.ts
│   │
│   ├── human/                           # Human-in-the-loop
│   │   ├── approval-manager.ts
│   │   └── types.ts
│   │
│   └── prompts/                         # Prompt dùng chung
│       ├── system.prompt.ts
│       ├── quiz-generator.prompt.ts
│       └── document-search.prompt.ts
│
├── knowledge/                           # Quản lý tri thức nội bộ (RAG)
│   ├── ingestion/
│   │   ├── document-loader.ts           # PDF/Markdown/TXT loader
│   │   ├── markdown-chunker.ts
│   │   ├── embedding-service.ts
│   │   └── ingestion-service.ts
│   │
│   ├── retrieval/
│   │   ├── vector-search.ts
│   │   ├── bm25-search.ts
│   │   ├── hybrid-retriever.ts
│   │   └── reranker.ts
│   │
│   ├── repositories/
│   │   ├── knowledge-base.repository.ts
│   │   ├── chunk.repository.ts
│   │   └── embedding.repository.ts
│   │
│   └── types.ts
│
├── quiz/                                # Domain logic cho trắc nghiệm
│   ├── services/
│   │   ├── quiz-generator.service.ts
│   │   ├── quiz-validator.service.ts
│   │   └── distractor-generator.service.ts
│   │
│   ├── repositories/
│   │   ├── quiz.repository.ts
│   │   └── question.repository.ts
│   │
│   └── types.ts
│
├── storage/                             # Persistence layer
│   ├── adapter.interface.ts
│   ├── pglite.adapter.ts
│   ├── opfs.adapter.ts
│   ├── repositories/
│   │   ├── chat.repository.ts
│   │   ├── knowledge.repository.ts
│   │   └── quiz.repository.ts
│   │
│   └── migrations/
│       ├── 001_create_knowledge_tables.sql
│       ├── 002_create_quiz_tables.sql
│       └── 003_create_chat_tables.sql
│
├── features/                            # UI theo từng chức năng
│   ├── chat/
│   │   ├── ChatPage.tsx
│   │   ├── components/
│   │   └── hooks/
│   │       └── useAgent.ts
│   │
│   ├── knowledge-base/
│   │   ├── KnowledgeBasePage.tsx
│   │   ├── UploadDocument.tsx
│   │   └── hooks/
│   │       └── useKnowledgeBase.ts
│   │
│   └── quiz/
│       ├── QuizPage.tsx
│       ├── QuizPlayer.tsx
│       └── hooks/
│           └── useQuiz.ts
│
├── shared/                              # Utilities dùng chung
│   ├── utils/
│   ├── constants/
│   └── types/
│
└── app/
    └── chat/
        └── page.tsx
```

## Phân loại file mã nguồn
Một file được coi là xương sống của mã nguồn đóng vai trò là nền tảng bất biến, giúp hệ thống có khả năng mở rộng vô hạn mà không cần can thiệp vào mã nguồn cũ
- File xương sống: bất biến trong quá trình mở rộng mã nguồn
- File không phải xương sống

**Triết lý thiết kế cho các file xương sống**
- Cơ chế đăng ký "Plug and Play": Các file xương sống không được phép biết về sự tồn tại cụ thể của các tính năng, thay vào đó chúng thực hiện quản lý một registry
- Đảo ngược sự phụ thuộc: Tầng cao không thụ thuộc vào tầng thấp. Cả hai đều phụ thuộc vào interface.
- Vận hành dựa trên trạng thái: file xương sống chỉ đóng vai trò là một máy trạng thái
- Vận hành dựa trên sự kiện: Sử dụng event-emitter.ts để các thành phần giao tiếp với nhau, giảm thiểu sự phụ thuộc trực tiếp giữa các module
- Giữ lõi siêu mỏng: nếu 1 tính năng bị loại bỏ mà ko ảnh hưởng đến khả năng vận hành của agent, file đó không phải thuộc xương sống.

**Triết lý cho các file không phải là xương sống**
- Năng lực nguyên tử: Mỗi Tool hoặc Capability phải được coi là một đơn vị độc lập hoàn toàn, để khi xóa bỏ mã nguồn hệ thống vẫn chạy nhưng ko còn thực hiện được tính năng đó nữa.
- Xoay quanh nghiệp vụ: mã nguồn phải nói ngôn ngữ của nghiệp vụ đó, không nói ngôn ngữ của Agent với mục tiêu Logic nghiệp vụ thuần túy sẽ dễ bảo trì.
- Tính thuần khiết: Các service xử lý dữ liệu ưu tiên các hàm thuần túy, Tránh gây ra các tác dụng phụ (side effects) khó kiểm soát khi Agent gọi nhiều Tool cùng lúc.
- Minh bạch lỗi: trả lỗi chi tiết.
- Không fix cứng các prompt vào file logic, tách chúng ra riêng các file cấu hình .prompt.ts

## End-to-End Lifecycle
```
[UI: ChatPage] ──(User Message)──> [AgentRuntime]
                                         │
                                   (1) Phân tích Intent
                                         ▼
                                  [Supervisor] ──(Chọn Mode & Capability)
                                         │
                                   (2) Điều hướng Engine
                                         ▼
                                  [Executors] ──(Gọi LLM / Tools nếu cần)
                                         │
                                   (3) Xử lý kết quả & Cập nhật State
                                         ▼
[UI: Hiển thị] <──(Stream / Text)── [AgentRuntime]
```

### Supervisor - *Bộ nào điều hướng của toàn bộ agent*

Supervisor hoàn toàn mù về mặt business logic, tất cả thông tin đều được nạp động từ `availableCapabilities` truyền vào.

Khi thêm một capability mới (ví dụ: `export-pdf.capability.ts`), chỉ cần đăng ký nó ở `bootstrap.ts` Supervisor sẽ tự động nhận biết qua metadata

Structured Output Enforcement via Prompting (Ép cấu hình đầu ra dạng cấu trúc bằng kỹ thuật Prompt)

### UI Structure
```
features/chat/ChatPage
            | MessageList
            │     └── MessageBubble
            │           ├── MarkdownRenderer
            │           └── ToolRenderer
            │                 └── WidgetRegistry
            │                       └── ChatFileUploadWidget
            │
            ├── ChatInput
            ├── ApprovalDialog
            └── hooks/useAgent 
 ```