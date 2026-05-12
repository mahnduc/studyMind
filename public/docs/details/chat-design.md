# Client-side Stateful Graph Agent Runtime
**Người dùng cung cấp api key**
```
React UI
   ↓
Client Agent Runtime
   ↓
State Graph Engine
   ├── Planner
   ├── Tool Executor
   ├── Memory
   ├── Retrieval
   ├── Reflection
   └── Provider Router
   ↓
HTTP LLM Providers
   ├── OpenAI
   ├── Groq
   ├── Gemini
   ├── Anthropic
   └── OpenRouter
```
Bản mô hình giản hóa
```
React UI
   ↓
Agent Runtime
   ↓
Conversation Engine
   ├── State Machine
   ├── Reasoning Loop
   ├── Tool Executor
   ├── Memory
   └── Event System
   ↓
Provider Layer
   ↓
HTTP APIs
```

cấu trúc thư mục cho runtime

```
agent/
 ├── runtime/
 │    ├── agent-runtime.ts
 │    ├── conversation-session.ts
 │    ├── reasoning-loop.ts
 │    └── event-emitter.ts
 │
 ├── memory/
 │
 ├── providers/
 │
 ├── tools/
 │
 ├── state/
 │
 └── types/
 ```


## Cấu trúc thư mục
`core\agent`
- `agent`
   - `providers`: thực hiện khởi tạo dịch vụ cho 1 provider ở router và provider đó được định hình bởi provider.interface
      - `groq.provider.ts`
      - `provider-router.ts`
      - `provider.interface.ts`
   - `runtime`
      - `agent-runtime.ts`
      - `conversation-session.ts`
      - `event-emitter.ts`
      - `reasoning-loop.ts`
   - `state`
      - `agent-state.ts`
   - `tools`
      - `definitions`
      - `tool-registry.ts`
      - `tool.interface.ts`
   - `types`
      - `chat.type.ts`: Bản thiết kế quy định cấu trúc tin nhắn chung cho hệ thống.

---
`core\feature`

`features`: UI tập chung
- `chat`
   - `components`
   - `hooks`