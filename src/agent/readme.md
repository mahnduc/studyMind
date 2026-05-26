# Types
## 1. Nhóm Hội thoại (Chat & Message)

Nhóm này quản lý toàn bộ ký ức và lịch sử tương tác giữa các thực thể trong hệ thống.

```typescript
export type ChatRole = "system" | "user" | "assistant" | "tool";

export interface ChatMessage {
  role: ChatRole;
  content?: string;
  name?: string;
  tool_call_id?: string;
  tool_calls?: ToolCall[];
}
```

* **`ChatRole`**: Định nghĩa danh tính của đối tượng phát ngôn.
* `system`: Lời bảo vệ/Chỉ thị tối cao cho Agent (ví dụ: *"Bạn là chuyên gia tư vấn..."*).
* `user`: Lời nói, câu hỏi của người dùng.
* `assistant`: Câu trả lời của chính Agent (LLM).
* `tool`: Kết quả trả về sau khi hệ thống của bạn thực thi xong một hàm ngầm (ví dụ: danh sách file quét được từ OPFS).


* **`ChatMessage`**: Cấu trúc của một tin nhắn.
* Một tin nhắn của `user` thường chỉ có `role` và `content`.
* Nhưng một tin nhắn của `assistant` (Agent) có thể **không có `content**` mà lại chứa một mảng `tool_calls` khi nó muốn kích hoạt công cụ.
* Một tin nhắn của `tool` bắt buộc phải kèm theo `tool_call_id` để khớp với lệnh gọi trước đó.

---
## 2. Nhóm Hệ thống Công cụ (Tools)

Đây là cầu nối giúp AI giao tiếp và điều khiển được phần cứng/bộ nhớ máy tính của bạn (Local-first). Nhóm này chia làm 3 giai đoạn: **Định nghĩa (AI đọc)** $\rightarrow$ **Yêu cầu gọi (AI ra lệnh)** $\rightarrow$ **Thực thi và Trả kết quả (Code của bạn chạy)**.

### Giai đoạn 1: Khai báo (`ToolDefinition`)

```typescript
export interface ToolDefinition {
  type: "function";
  function: {
    name: string;
    description: string;
    parameters: {
      type: "object";
      properties: Record<string, any>;
      required?: string[]; // Quy định các tham số bắt buộc của RIÊNG tool này
    };
  };
}

```

* **Mục đích**: Đây là "Menu" bạn gửi cho AI. Bạn mô tả cho AI biết: *"Tôi có hàm tên là `generate_document_learning_plan`, nó dùng để làm gì, nó cần nhận vào các tham số nào (như `document_name` kiểu string)"*.
* AI sẽ đọc cái này để biết khi nào nên dùng nó.

### Giai đoạn 2: Phát lệnh gọi (`ToolCall`)

```typescript
export interface ToolCall {
  id: string; // Mã định danh duy nhất cho lượt gọi này (ví dụ: call_123)
  type: "function";
  function: {
    name: string;
    arguments: string; // Chuỗi JSON chứa giá trị truyền vào (ví dụ: '{"hours_per_day": 2}')
  };
}

```

* **Mục đích**: Khi AI đọc Menu (`ToolDefinition`) và quyết định sử dụng, nó sẽ tự sinh ra object `ToolCall` này và trả về cho bạn.
* `arguments` ở đây là một **chuỗi JSON (string)** chứ không phải object, vì AI xuất ra văn bản. Nhiệm vụ của tầng Core của bạn là `JSON.parse(arguments)` để lấy dữ liệu thực tế ra xử lý.

### Giai đoạn 3: Thực thi (`ToolExecutor`) và Trả kết quả (`ToolResult`)

```typescript
export interface ToolExecutor {
  name: string;
  execute: (args: any, session: AgentSession) => Promise<ToolResult>;
}

export interface ToolResult {
  success: boolean;
  data?: any;
  error?: string;
}

```

* **`ToolExecutor`**: Là những đoạn code TypeScript "bằng xương bằng thịt" của bạn (như việc bạn gọi hàm đọc file từ OPFS). Nó sẽ nhận vào các tham số (`args`) đã parse và toàn bộ phiên làm việc hiện tại (`session`) để xử lý logic.
* **`ToolResult`**: Sau khi code của bạn chạy xong (Thành công hay Thất bại do thiếu file), nó đóng gói kết quả vào `ToolResult` để gửi ngược lại cho AI đọc và trả lời tiếp cho người dùng.

---

## 3. Nhóm Quản lý Trạng thái (Session, State & Config)

Nhóm này đóng vai trò như "bộ não" quản lý vòng đời và giới hạn hành vi của Agent để tránh việc AI bị lặp vô hạn hoặc mất trí nhớ.

```typescript
export interface AgentState {
  step: number;       // Bước hiện tại trong lượt suy nghĩ của Agent
  maxSteps: number;   // Số bước tối đa Agent được phép suy nghĩ trong 1 lượt thoại
  isFinished: boolean;// Agent đã hoàn thành tác vụ và trả lời xong chưa?
}

export interface AgentSession<TData = any> {
  history: ChatMessage[];       // Ký ức hội thoại xuyên suốt
  collectedData: TData;         // Kho lưu trữ dữ liệu đệm (State quản lý tập trung)
  state: AgentState;            // Trạng thái vận hành tại runtime
}

export interface AgentConfig {
  systemPrompt: string;
  model?: string;
  temperature?: number;
  maxTokens?: number;
  maxSteps?: number;
  history?: ChatMessage[];
  tools?: ToolDefinition[];     // Mảng các Menu công cụ Agent có quyền dùng
  executors?: ToolExecutor[];   // Mảng các hàm xử lý tương ứng với Menu trên
}

```

* **`AgentState`**: Rất quan trọng để chống loop. Ví dụ, nếu AI gọi Tool $\rightarrow$ Tool lỗi $\rightarrow$ AI lại gọi tiếp Tool đó $\rightarrow$ Lặp vô hạn gây tốn API/Crash trình duyệt. Biến `step` và `maxSteps` (ví dụ giới hạn là 5 bước) giúp tầng Orchestrator ngắt Agent ngay lập tức nếu nó vượt ngưỡng suy nghĩ.
* **`AgentSession`**: Là trạng thái sống (Runtime State) của một phiên chat. Nó lưu lại lịch sử (`history`) và một kho dữ liệu phẳng `collectedData` (bạn đang dùng Generic `<TData = any>` rất tốt) giúp các Tool có thể đọc ghi dữ liệu chéo nhau trong quá trình hội thoại.
* **`AgentConfig`**: Là "bản thiết kế" cấu hình tĩnh (Static Factory) của một Agent. Khi bạn tạo ra `dynamicLearningPlannerAgent`, bạn định hình sẵn tính cách (`systemPrompt`), độ nhạy bén (`temperature`), và ném cho nó tập hợp các công cụ nó được phép dùng (`tools` và `executors`).

---

## Tổng kết: Luồng đi của các Type khi chạy

1. Hệ thống khởi tạo dựa trên **`AgentConfig`**.
2. Một phiên làm việc **`AgentSession`** được tạo ra để theo dõi tiến trình.
3. Người dùng gửi tin nhắn (`ChatMessage` với role `"user"`).
4. Hệ thống gửi toàn bộ `history` + `systemPrompt` + mảng **`ToolDefinition`** lên LLM.
5. LLM trả về một tin nhắn (`ChatMessage` với role `"assistant"`) có chứa yêu cầu gọi hàm **`ToolCall`**.
6. Tầng Core Orchestrator bắt lấy `ToolCall`, lôi đúng **`ToolExecutor`** ra chạy, trả về **`ToolResult`**.
7. Đóng gói `ToolResult` thành một **`ChatMessage`** với role `"tool"` nạp lại vào `history` của **`AgentSession`**.
8. Lặp lại cho đến khi **`AgentState.isFinished`** chuyển thành `true`.