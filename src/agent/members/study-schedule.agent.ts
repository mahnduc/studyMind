import {
  AgentConfig,
  ToolDefinition,
  ToolExecutor,
  ToolResult,
} from "../core/types";

interface ScheduleArgs {
  target_goal: string;
  total_weeks: number;
  available_days_of_week: string[];
  preferred_time_slots: string[];
  energy_pattern?: "morning" | "afternoon" | "night";
  productive_hours?: string[];
}

interface Milestone {
  id: string;
  title: string;
  description: string;
  estimatedWeeks: number;
  priority: "high" | "medium" | "low";
}

interface Habit {
  id: string;
  name: string;
  frequency: string;
  trigger: string;
  minimumAction: string;
}

interface StudySession {
  id: string;
  day: string;
  slot: string;
  task: string;
  milestone: string;
  sessionType: string;
  estimatedDurationMinutes: number;
}

interface WeeklyPlan {
  week: number;
  focus: string;
  milestone: string;
  sessions: StudySession[];
}

interface IntelligentTimetable {
  id: string;
  createdAt: string;
  summary: {
    targetGoal: string;
    totalWeeks: number;
    studyDaysPerWeek: number;
    estimatedHoursPerWeek: number;
  };
  milestones: Milestone[];
  habits: Habit[];
  weeklyPlan: WeeklyPlan[];
  recommendations: string[];
}

function generateId(): string {
  return crypto.randomUUID();
}

function estimateHoursPerWeek(days: string[], slots: string[]): number {
  const totalMinutes = days.length * slots.length * 90;
  return Number((totalMinutes / 60).toFixed(1));
}

function generateMilestones(targetGoal: string): Milestone[] {
  return [
    {
      id: generateId(),
      title: "Nền tảng vững chắc",
      description: `Tiếp cận và xây dựng tư duy cốt lõi về: ${targetGoal}`,
      estimatedWeeks: 2,
      priority: "high",
    },
    {
      id: generateId(),
      title: "Thực hành ứng dụng",
      description: "Triển khai các bài tập thực tế và case study chuyên sâu",
      estimatedWeeks: 4,
      priority: "high",
    },
    {
      id: generateId(),
      title: "Đánh giá & Tối ưu",
      description: "Review toàn bộ lỗ hổng kiến thức và tối ưu hóa hiệu suất",
      estimatedWeeks: 2,
      priority: "medium",
    },
  ];
}

function generateHabits(): Habit[] {
  return [
    {
      id: generateId(),
      name: "Daily Deep Work",
      frequency: "daily",
      trigger: "Ngay khi bắt đầu phiên học",
      minimumAction: "Tập trung tuyệt đối trong 25 phút không thiết bị điện tử",
    },
    {
      id: generateId(),
      name: "Weekly Reflection",
      frequency: "weekly",
      trigger: "Cuối tuần",
      minimumAction: "Dành 10 phút đánh giá tiến độ và tinh chỉnh workload",
    },
  ];
}

function generateWeeklyPlan(args: ScheduleArgs, milestones: Milestone[]): WeeklyPlan[] {
  const weeklyPlan: WeeklyPlan[] = [];
  let milestoneIndex = 0;

  for (let week = 1; week <= args.total_weeks; week++) {
    const sessions: StudySession[] = [];
    const currentMilestone = milestones[Math.min(milestoneIndex, milestones.length - 1)];

    for (const day of args.available_days_of_week) {
      for (const slot of args.preferred_time_slots) {
        sessions.push({
          id: generateId(),
          day,
          slot,
          task: currentMilestone.title,
          milestone: currentMilestone.title,
          sessionType: slot.toLowerCase().includes("sáng") || slot.toLowerCase().includes("morning") ? "deep_work" : "review",
          estimatedDurationMinutes: 90,
        });
      }
    }

    weeklyPlan.push({
      week,
      focus: currentMilestone.description,
      milestone: currentMilestone.title,
      sessions,
    });

    if (week % currentMilestone.estimatedWeeks === 0) {
      milestoneIndex++;
    }
  }

  return weeklyPlan;
}

async function saveTimetableToOPFS(timetable: IntelligentTimetable) {
  if (typeof navigator === "undefined" || !navigator.storage) {
    return { success: false, filename: null, reason: "Browser không hỗ trợ OPFS." };
  }

  try {
    const root = await navigator.storage.getDirectory();
    const dir = await root.getDirectoryHandle("ai-learning-system", { create: true });
    const filename = `timetable-${Date.now()}.json`;
    const fileHandle = await dir.getFileHandle(filename, { create: true });
    const writable = await fileHandle.createWritable();
    
    await writable.write(JSON.stringify(timetable, null, 2));
    await writable.close();

    return { success: true, filename };
  } catch (error: any) {
    return {
      success: false,
      filename: null,
      reason: error?.message || "Không thể lưu timetable vào cấu trúc OPFS.",
    };
  }
}

const intelligentScheduleTool: ToolDefinition = {
  type: "function",
  function: {
    name: "generate_intelligent_timetable",
    description: "Xây dựng hệ thống lịch trình học tập tổng quát dạng JSON và lưu trữ trực tiếp vào OPFS.",
    parameters: {
      type: "object",
      properties: {
        target_goal: {
          type: "string",
          description: "Mục tiêu học tập tổng quát của người dùng.",
        },
        total_weeks: {
          type: "number",
          description: "Tổng số tuần phân bổ cho toàn bộ lộ trình.",
        },
        available_days_of_week: {
          type: "array",
          items: { type: "string" },
          description: "Các ngày trong tuần có thể sắp xếp học (ví dụ: ['Thứ 2', 'Thứ 3']).",
        },
        preferred_time_slots: {
          type: "array",
          items: { type: "string" },
          description: "Các khung thời gian ưu tiên trong ngày (ví dụ: ['Sáng sớm', 'Buổi tối']).",
        },
        energy_pattern: {
          type: "string",
          enum: ["morning", "afternoon", "night"],
        },
        productive_hours: {
          type: "array",
          items: { type: "string" },
        },
      },
      required: [
        "target_goal",
        "total_weeks",
        "available_days_of_week",
        "preferred_time_slots",
      ],
    },
  },
};

const intelligentScheduleExecutor: ToolExecutor = {
  name: "generate_intelligent_timetable",

  async execute(args: ScheduleArgs, session: any): Promise<ToolResult> {
    try {
      const milestones = generateMilestones(args.target_goal);
      const habits = generateHabits();
      const weeklyPlan = generateWeeklyPlan(args, milestones);

      const timetable: IntelligentTimetable = {
        id: generateId(),
        createdAt: new Date().toISOString(),
        summary: {
          targetGoal: args.target_goal,
          totalWeeks: args.total_weeks,
          studyDaysPerWeek: args.available_days_of_week.length,
          estimatedHoursPerWeek: estimateHoursPerWeek(
            args.available_days_of_week,
            args.preferred_time_slots
          ),
        },
        milestones,
        habits,
        weeklyPlan,
        recommendations: [
          "Ứng dụng quy tắc Pomodoro 25/5 để duy trì nhịp tập trung cao độ.",
          "Thực hiện kiểm tra chủ động (Active Recall) vào mỗi cuối tuần.",
          "Duy trì tính nhất quán (Consistency) quan trọng hơn động lực nhất thời.",
        ],
      };

      if (session?.collectedData) {
        session.collectedData.lastGeneratedTimetable = timetable;
      }

      const saveResult = await saveTimetableToOPFS(timetable);

      return {
        success: true,
        data: {
          saved: saveResult.success,
          filename: saveResult.filename,
          reason: saveResult.reason,
          timetable,
        },
      };
    } catch (error: any) {
      return {
        success: false,
        error: error?.message || "Lỗi cục bộ trong quá trình khởi tạo cấu trúc Timetable.",
      };
    }
  },
};

export const intelligentSelfImprovementAgent: AgentConfig = {
  model: "llama-3.3-70b-versatile",
  temperature: 0.7,
  maxTokens: 4096,
  maxSteps: 5,
  systemPrompt: `
Bạn là Hệ thống Kiến trúc Học tập Thông minh (Self-Improvement Architect).

NHIỆM VỤ CHÍNH:
- Tiếp nhận mục tiêu, phân rã và thiết kế thời gian biểu tối ưu hóa cho người dùng.
- Giao tiếp hoàn toàn bằng Tiếng Việt thân thiện, rõ ràng.

QUY TẮC THU THẬP DỮ LIỆU NGHIÊM NGẶT (STRICT VALIDATION):
Bạn bắt buộc phải có đầy đủ thông tin xác thực từ người dùng cho 4 tham số sau:
1. \`target_goal\` (Mục tiêu học tập cụ thể là gì?)
2. \`total_weeks\` (Tổng số tuần người dùng muốn thực hiện lộ trình này?)
3. \`available_days_of_week\` (Những ngày nào trong tuần có thể học?)
4. \`preferred_time_slots\` (Khung giờ cụ thể mong muốn trong ngày?)

ĐIỀU KIỆN KÍCH HOẠT TOOL:
- CHỈ ĐƯỢC PHÉP gọi công cụ \`generate_intelligent_timetable\` khi và chỉ khi người dùng đã cung cấp MINH BẠCH, ĐẦY ĐỦ cả 4 thông tin trên.
- TUYỆT ĐỐI KHÔNG tự ý suy diễn, tự bịa hoặc tự điền giá trị mặc định cho bất kỳ tham số nào (ví dụ: tự chọn số tuần là 12 hoặc tự tính thời gian khi người dùng chưa nói).
- Nếu phát hiện thiếu dù chỉ một thông tin, hãy dừng lại và đưa ra câu hỏi phản hồi ngắn gọn để yêu cầu người dùng cung cấp nốt thông tin còn thiếu đó.
`,
  tools: [intelligentScheduleTool],
  executors: [intelligentScheduleExecutor],
};