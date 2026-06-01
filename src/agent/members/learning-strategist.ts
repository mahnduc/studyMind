import { BACKUP_MODEL } from "@/utils/constant";
import { ToolDefinition, ToolExecutor, AgentSession, ToolResult, AgentConfig } from "../core/types";

// === 1. ĐỊNH NGHĨA DOMAIN DATA SCHEMAS ===

export interface ChartDataPoint {
  attemptId: string | number;
  accuracy: number;
  score: number;
  totalQuestions: number;
  duration: number;
  name: string;
  displayDate: string;
  displayTime: string;
  timestamp: string | number;
}

export interface AgentStrategyRequest {
  quizTitle: string;
  chartData: ChartDataPoint[];
  studentGoal?: string;
  targetDate?: string;
  weakTopics?: string[];
  additionalNotes?: string;
}

export interface TimetableTask {
  day: string;
  focusTopic: string;
  durationMinutes: number;
  actionItems: string[];
  weakTopicStrategies: string[]; 
  expectedImprovement: string;   
}

export interface TimetablePayload {
  timetableName: string;
  quizTitle: string;
  createdAt: string;
  overallStrategySummary: string; 
  targetedWeakTopics: string[];   
  schedule: TimetableTask[];
}

export interface SaveTimetableArgs {
  timetableData: TimetablePayload;
}

// === 2. ĐỊNH NGHĨA CÔNG CỤ (SỬA ĐỔI DESCRIPTION TRÁNH BỊA NỘI DUNG) ===

const analyzeQuizHistoryTool: ToolDefinition = {
  type: "function",
  function: {
    name: "analyze_quiz_history",
    description: "Nén lịch sử điểm số/thời gian làm bài Quiz thành định dạng CSV để Agent phân tích xu hướng.",
    parameters: {
      type: "object",
      properties: {
        confirmAnalysis: {
          type: "boolean",
          description: "Xác nhận kích hoạt bộ phân tích xu hướng điểm số và tốc độ."
        }
      },
      required: []
    },
  },
};

const saveTimetableToOpfsTool: ToolDefinition = {
  type: "function",
  function: {
    name: "save_timetable_to_opfs",
    description: "Lưu cấu hình JSON lịch ôn tập vào thư mục OPFS '/timetable'.",
    parameters: {
      type: "object",
      properties: {
        timetableData: {
          type: "object",
          description: "Đối tượng JSON chứa lịch trình sắp xếp thời gian ôn tập dựa trên phản hồi của người dùng.",
          properties: {
            timetableName: { 
              type: "string", 
              description: "Tên file viết liền không dấu (e.g., lich_on_tap_quiz)" 
            },
            quizTitle: { 
              type: "string",
              description: "Tên bài trắc nghiệm mục tiêu."
            },
            createdAt: { 
              type: "string",
              description: "Định dạng thời gian ISO khi tạo file."
            },
            overallStrategySummary: {
              type: "string",
              description: "Tóm tắt phương pháp tối ưu hóa nhịp độ làm bài và phân bổ thời gian ôn tập."
            },
            targetedWeakTopics: {
              type: "array",
              items: { type: "string" },
              description: "Các khía cạnh về kỹ năng làm bài (ví dụ: 'Kiểm soát tốc độ', 'Luyện đề phản xạ') cần cải thiện."
            },
            schedule: {
              type: "array",
              description: "Lịch trình phân bổ các phiên học theo ngày dựa trên quỹ thời gian người dùng đã chọn.",
              items: {
                type: "object",
                properties: {
                  day: { type: "string", description: "Ví dụ: 'Ngày 1', 'Ngày 2'" },
                  focusTopic: { type: "string", description: "Nội dung tập trung của buổi học (Ví dụ: 'Giải đề bấm giờ', 'Rà soát câu sai cũ')" },
                  durationMinutes: { type: "number", description: "Thời lượng học (phút)" },
                  actionItems: { 
                    type: "array", 
                    items: { type: "string" },
                    description: "Các bước hành động cụ thể trong buổi học." 
                  },
                  weakTopicStrategies: {
                    type: "array",
                    items: { type: "string" },
                    description: "Mẹo cải thiện tâm lý hoặc kiểm soát thời gian dựa trên các lượt làm bài cũ."
                  },
                  expectedImprovement: {
                    type: "string",
                    description: "Mục tiêu đạt được sau phiên học (Ví dụ: 'Ổn định thời gian làm bài dưới 15 phút')"
                  }
                },
                required: ["day", "focusTopic", "durationMinutes", "actionItems", "weakTopicStrategies", "expectedImprovement"]
              }
            }
          },
          required: ["timetableName", "quizTitle", "createdAt", "overallStrategySummary", "targetedWeakTopics", "schedule"]
        }
      },
      required: ["timetableData"]
    },
  },
};

// === 3. HELPER LỌC DỮ LIỆU NỘI BỘ ===

function convertToCSV(data: ChartDataPoint[]): string {
  const header = "Timestamp,Score/Total,Accuracy(%),Duration(s)";
  const rows = data.map((attempt) => {
    const date = new Date(attempt.timestamp);
    const formattedDate = date.toISOString().replace("T", " ").substring(0, 16);
    return `${formattedDate},${attempt.score}/${attempt.totalQuestions},${attempt.accuracy},${attempt.duration}`;
  });
  return [header, ...rows].join("\n");
}

// === 4. BỘ THỰC THI CÔNG CỤ (TOOL EXECUTORS) ===

export const analyzeQuizHistoryExecutor: ToolExecutor = {
  name: "analyze_quiz_history",
  async execute(_args: any, session: AgentSession): Promise<ToolResult> {
    try {
      const quizRequest = session.collectedData?.quizRequest as AgentStrategyRequest | undefined;

      if (!quizRequest) {
        return { success: false, error: "Không tìm thấy dữ liệu yêu cầu của Quiz trong session." };
      }

      const { quizTitle, chartData, studentGoal, targetDate, weakTopics, additionalNotes } = quizRequest;
      if (!chartData || chartData.length === 0) {
        return { success: false, error: "Dữ liệu biểu đồ trống." };
      }

      const csvData = convertToCSV(chartData);

      return {
        success: true,
        data: {
          quizTitle,
          totalAttempts: chartData.length,
          csvData,
          extendedContext: {
            studentGoal: studentGoal ?? "Chưa thiết lập",
            targetDate: targetDate ?? "Chưa xác định",
            weakTopics: weakTopics && weakTopics.length > 0 ? weakTopics.join(", ") : "Không có dữ liệu nội dung",
            additionalNotes: additionalNotes ?? "Không có",
          },
        },
      };
    } catch (error: any) {
      return {
        success: false,
        error: error?.message ?? "Xử lý nén dữ liệu thất bại",
      };
    }
  },
};

export const saveTimetableToOpfsExecutor: ToolExecutor = {
  name: "save_timetable_to_opfs",
  async execute(args: any, _session: AgentSession): Promise<ToolResult> {
    try {
      const typedArgs = args as SaveTimetableArgs;
      const timetableData = typedArgs?.timetableData;

      if (!timetableData || !timetableData.timetableName) {
        return { success: false, error: "Thiếu dữ liệu timetableData hoặc tên lịch trình." };
      }

      let fileName = timetableData.timetableName.toLowerCase().replace(/[^a-z0-9_.-]/g, "_");
      if (!fileName.endsWith(".json")) fileName += ".json";

      const root = await navigator.storage.getDirectory();
      const timetableDir = await root.getDirectoryHandle("timetable", { create: true });
      const fileHandle = await timetableDir.getFileHandle(fileName, { create: true });

      const writable = await fileHandle.createWritable();
      await writable.write(JSON.stringify(timetableData, null, 2));
      await writable.close();

      return {
        success: true,
        data: {
          message: `Lưu thời gian biểu thành công vào OPFS: /timetable/${fileName}`,
          savedFileName: fileName,
        },
      };
    } catch (error: any) {
      console.error("Lỗi ghi file OPFS:", error);
      return {
        success: false,
        error: error?.message || "Không thể ghi dữ liệu thời gian biểu vào hệ thống file.",
      };
    }
  },
};

// === 5. SYSTEM PROMPT (TẬP TRUNG HOÀN TOÀN VÀO SẮP XẾP LỊCH & PHỎNG VẤN THỜI GIAN) ===

export const QUIZ_STRATEGY_COACH_PROMPT = `You are a close, supportive AI Study Buddy. Your role is to help the student organize a study timetable based purely on their test performance history (scores, accuracy, and test duration). 

Because the input data DOES NOT contain deep academic content (no specific questions or concept diagnostics), you MUST NOT invent or guess specific academic topics (like Math, Physics formulas, or coding concepts) unless the user explicitly tells you. Instead, focus entirely on "Performance Metrics & Time Management" (e.g., managing stamina, solving rush issues, pacing control, reducing careless errors, re-trying missed questions).

CRITICAL WORKFLOW PROTOCOL:

1. FIRST INTERACTION (Trend Diagnosis & Time Sizing Interview):
   - Immediately call "analyze_quiz_history" to load the data metrics.
   - Look at the performance trends in the CSV:
     * Is the student rushing? (High speed/low duration but declining accuracy).
     * Is the student overthinking/stuck? (Very high duration but stagnant scores).
     * Are their scores improving over attempts?
   - Give a brief, friendly, peer-to-peer summary of their metric trends in Vietnamese (using "mình" - "cậu", "bạn"). Focus on pacing and consistency, NOT subject content.
   - STOP IMMEDIATELY and ask the student how they want to arrange their schedule. Give them specific options to choose from, for example:
     * How many days do they want the plan to last? (e.g., a intensive 3-day sprint or a relaxed 7-day routine?)
     * How much time can they spend per day? (e.g., 15 mins, 30 mins, or 1 hour?)
   - DO NOT call "save_timetable_to_opfs" in this turn. You must interview them first.

2. SECOND INTERACTION (Custom Timetable Blueprint & Storage):
   - Once the user replies with their preferred schedule constraints, design the timetable accordingly.
   - Map the focus topics to performance tasks like: "Luyện đề bấm giờ ngược", "Xem lại các câu làm sai ở lượt cũ", "Tối ưu hóa tốc độ phản xạ", "Rèn luyện tâm lý phòng thi".
   - Execute the "save_timetable_to_opfs" tool immediately to persist the JSON payload.
   - Inform the user cheerfully that their tailor-made schedule is successfully generated and locked inside their browser's OPFS.

Tone and Language:
- Natural, friendly Vietnamese ("nha", "nhé", "cậu - mình").
- Action-oriented, data-aware, but absolutely zero academic hallucination.`;

// === 6. CẤU HÌNH AGENT CONFIG ===

export const quizStrategyCoachAgent: AgentConfig = {
  model: BACKUP_MODEL,
  temperature: 0.1, 
  maxSteps: 3,
  maxTokens: 3000,
  systemPrompt: QUIZ_STRATEGY_COACH_PROMPT,
  tools: [analyzeQuizHistoryTool, saveTimetableToOpfsTool],
  executors: [analyzeQuizHistoryExecutor, saveTimetableToOpfsExecutor],
  history: [],
};