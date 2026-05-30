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
  skill_level?: "beginner" | "intermediate" | "advanced";
  daily_session_limit_minutes?: number;
}

type Priority = "high" | "medium" | "low";
type SessionType =
  | "deep_work"
  | "review"
  | "practice"
  | "assessment"
  | "rest_reflection";

interface Milestone {
  id: string;
  order: number;
  title: string;
  description: string;
  startWeek: number;
  endWeek: number;
  estimatedWeeks: number;
  priority: Priority;
  successCriteria: string[];
  deliverables: string[];
}

interface Habit {
  id: string;
  name: string;
  frequency: "daily" | "weekly" | "bi-weekly";
  trigger: string;
  minimumAction: string;
  habitStack?: string;
  reward?: string;
}

interface StudySession {
  id: string;
  day: string;
  slot: string;
  startTime?: string;
  endTime?: string;
  task: string;
  milestoneId: string;
  milestoneTitle: string;
  sessionType: SessionType;
  estimatedDurationMinutes: number;
  objectives: string[];
  techniques: string[];
  resources?: string[];
  notes?: string;
}

interface WeeklyPlan {
  week: number;
  theme: string;
  focus: string;
  milestoneId: string;
  milestoneTitle: string;
  totalStudyMinutes: number;
  sessions: StudySession[];
  weeklyGoals: string[];
  reviewPrompts: string[];
}

interface ProgressCheckpoint {
  week: number;
  checkpointTitle: string;
  selfAssessmentQuestions: string[];
  adjustmentTriggers: string[];
}

interface IntelligentTimetable {
  id: string;
  version: string;
  createdAt: string;
  summary: {
    targetGoal: string;
    totalWeeks: number;
    studyDaysPerWeek: number;
    sessionsPerWeek: number;
    estimatedHoursPerWeek: number;
    totalEstimatedHours: number;
    energyPattern: string;
    skillLevel: string;
  };
  learningPrinciples: string[];
  milestones: Milestone[];
  habits: Habit[];
  weeklyPlan: WeeklyPlan[];
  progressCheckpoints: ProgressCheckpoint[];
  recommendations: string[];
  contingencyRules: string[];
}

function generateId(): string {
  return crypto.randomUUID();
}

function estimateHoursPerWeek(days: string[], slots: string[], minutesPerSession = 90): number {
  const total = days.length * slots.length * minutesPerSession;
  return Number((total / 60).toFixed(1));
}

function assignSessionType(slot: string, weekIndex: number, dayIndex: number): SessionType {
  const s = slot.toLowerCase();
  if (s.includes("sáng") || s.includes("morning")) return "deep_work";
  if (s.includes("tối") || s.includes("night") || s.includes("evening")) return "review";
  if (dayIndex === 0) return "deep_work";
  if (weekIndex % 4 === 3) return "assessment";
  return "practice";
}

function getSessionObjectives(sessionType: SessionType, milestone: Milestone): string[] {
  const base: Record<SessionType, string[]> = {
    deep_work: [
      `Nắm vững khái niệm cốt lõi thuộc milestone: ${milestone.title}`,
      "Xây dựng mental model rõ ràng cho chủ đề hôm nay",
    ],
    review: [
      "Ôn tập và củng cố kiến thức đã học trong tuần",
      "Phát hiện lỗ hổng kiến thức và điền vào chỗ trống",
    ],
    practice: [
      "Áp dụng kiến thức vào bài tập thực tế",
      "Cải thiện tốc độ và độ chính xác thông qua lặp lại",
    ],
    assessment: [
      "Đánh giá mức độ thành thạo so với tiêu chí milestone",
      "Lập kế hoạch điều chỉnh cho tuần tiếp theo",
    ],
    rest_reflection: [
      "Ghi chép những insight nổi bật trong tuần",
      "Nạp lại năng lượng nhận thức (cognitive recharge)",
    ],
  };
  return base[sessionType];
}

function getSessionTechniques(sessionType: SessionType, energyPattern: string): string[] {
  const techniques: Record<SessionType, string[]> = {
    deep_work: ["Pomodoro 50/10", "Mind-mapping sau mỗi block", "Không điện thoại"],
    review: ["Active Recall", "Feynman Technique", "Spaced Repetition (Anki/thủ công)"],
    practice: ["Deliberate Practice", "Error-logging (ghi lại lỗi sai)", "Timed drills"],
    assessment: ["Mock test cá nhân", "Checklist tiêu chí milestone", "Peer review (nếu có)"],
    rest_reflection: ["Free journaling 5 phút", "Gratitude + wins note", "Mindful breathing"],
  };
  return techniques[sessionType];
}

function generateMilestones(targetGoal: string, totalWeeks: number): Milestone[] {
  // Adaptive milestone distribution based on total weeks
  const phase1Weeks = Math.max(2, Math.round(totalWeeks * 0.25));
  const phase2Weeks = Math.max(3, Math.round(totalWeeks * 0.45));
  const phase3Weeks = Math.max(2, Math.round(totalWeeks * 0.20));
  const phase4Weeks = totalWeeks - phase1Weeks - phase2Weeks - phase3Weeks;

  const milestones: Milestone[] = [
    {
      id: generateId(),
      order: 1,
      title: "Xây dựng nền tảng tư duy",
      description: `Tiếp cận tổng quan, xây dựng mental model và nắm vững kiến thức nền tảng cho: ${targetGoal}`,
      startWeek: 1,
      endWeek: phase1Weeks,
      estimatedWeeks: phase1Weeks,
      priority: "high",
      successCriteria: [
        "Giải thích được khái niệm cốt lõi bằng ngôn ngữ của chính mình (Feynman Test)",
        "Hoàn thành ít nhất 80% tài liệu nền tảng",
        "Xây dựng được mindmap tổng quan về chủ đề",
      ],
      deliverables: [
        "Bộ note tóm tắt kiến thức nền",
        "Mindmap tổng quan chủ đề",
      ],
    },
    {
      id: generateId(),
      order: 2,
      title: "Thực hành chuyên sâu",
      description: "Áp dụng kiến thức vào bài tập thực tế, case study, và dự án nhỏ để củng cố hiểu biết",
      startWeek: phase1Weeks + 1,
      endWeek: phase1Weeks + phase2Weeks,
      estimatedWeeks: phase2Weeks,
      priority: "high",
      successCriteria: [
        "Hoàn thành tối thiểu 3 bài tập/dự án thực hành",
        "Tỷ lệ chính xác trên 70% khi làm bài tập độc lập",
        "Có thể xử lý tình huống mới không có trong tài liệu",
      ],
      deliverables: [
        "Portfolio bài tập thực hành",
        "Error log với phân tích nguyên nhân",
      ],
    },
    {
      id: generateId(),
      order: 3,
      title: "Củng cố & Mở rộng",
      description: "Ôn tập hệ thống, lấp đầy lỗ hổng kiến thức và kết nối các khái niệm nâng cao",
      startWeek: phase1Weeks + phase2Weeks + 1,
      endWeek: phase1Weeks + phase2Weeks + phase3Weeks,
      estimatedWeeks: phase3Weeks,
      priority: "medium",
      successCriteria: [
        "Không còn lỗ hổng kiến thức cơ bản (tự đánh giá < 2/10 điểm yếu)",
        "Kết nối được ít nhất 5 khái niệm quan trọng với nhau",
        "Giải thích được cho người khác nghe và hiểu",
      ],
      deliverables: [
        "Knowledge gap analysis report",
        "Bản tóm tắt kiến thức nâng cao",
      ],
    },
    {
      id: generateId(),
      order: 4,
      title: "Tổng hợp & Đánh giá cuối lộ trình",
      description: "Tổng hợp toàn bộ kiến thức, đánh giá mức độ đạt mục tiêu và lên kế hoạch tiếp theo",
      startWeek: phase1Weeks + phase2Weeks + phase3Weeks + 1,
      endWeek: totalWeeks,
      estimatedWeeks: Math.max(1, phase4Weeks),
      priority: "medium",
      successCriteria: [
        `Đạt được mục tiêu đề ra: ${targetGoal}`,
        "Hoàn thành đánh giá cuối kỳ với kết quả rõ ràng",
        "Có kế hoạch hành động cụ thể cho giai đoạn tiếp theo",
      ],
      deliverables: [
        "Final self-assessment report",
        "Kế hoạch học tập tiếp theo (Next 90 days)",
      ],
    },
  ];

  return milestones;
}

function generateHabits(energyPattern: string): Habit[] {
  return [
    {
      id: generateId(),
      name: "Intention Setting",
      frequency: "daily",
      trigger: "Trước khi bắt đầu phiên học 2 phút",
      minimumAction: "Viết ra 1 mục tiêu cụ thể cho phiên học này là gì",
      habitStack: "Sau khi pha cà phê/trà → Mở notebook → Viết mục tiêu",
      reward: "Được bắt đầu phiên học với sự tập trung rõ ràng",
    },
    {
      id: generateId(),
      name: "Pomodoro Deep Work",
      frequency: "daily",
      trigger: "Ngay sau khi Intention Setting",
      minimumAction: `Tập trung ${energyPattern === "morning" ? "50/10" : "25/5"} phút, không thiết bị điện tử`,
      habitStack: "Sau Intention Setting → Bật timer → Tắt thông báo",
      reward: "Đánh dấu hoàn thành 1 Pomodoro vào habit tracker",
    },
    {
      id: generateId(),
      name: "Active Recall Review",
      frequency: "daily",
      trigger: "Kết thúc mỗi phiên học",
      minimumAction: "Đóng tài liệu, viết ra 3 điều quan trọng nhất đã học hôm nay không nhìn note",
      habitStack: "Sau phiên học cuối → Đóng tài liệu → Viết brain dump",
      reward: "Tăng retention tự nhiên, không cần ôn lại từ đầu",
    },
    {
      id: generateId(),
      name: "Weekly Performance Review",
      frequency: "weekly",
      trigger: "Cuối ngày Chủ Nhật (hoặc ngày cuối tuần học)",
      minimumAction: "Trả lời 3 câu: Tuần này làm tốt gì? Cần cải thiện gì? Tuần sau ưu tiên gì?",
      habitStack: "Sau bữa tối Chủ Nhật → Mở journal → Review 15 phút",
      reward: "Cảm giác kiểm soát và rõ ràng cho tuần tiếp theo",
    },
    {
      id: generateId(),
      name: "Knowledge Spaced Repetition",
      frequency: "bi-weekly",
      trigger: "Mỗi 2 tuần, trước khi bước sang milestone mới",
      minimumAction: "Ôn lại toàn bộ note của 2 tuần qua bằng phương pháp Active Recall",
      habitStack: "Thứ 7 cuối kỳ review → Mở Anki/Notion → Flashcard review",
      reward: "Không bao giờ quên kiến thức đã học",
    },
  ];
}

function generateWeeklyPlan(args: ScheduleArgs, milestones: Milestone[]): WeeklyPlan[] {
  const weeklyPlan: WeeklyPlan[] = [];
  const minutesPerSession = args.daily_session_limit_minutes ?? 90;
  const energy = args.energy_pattern ?? "morning";

  for (let week = 1; week <= args.total_weeks; week++) {
    const currentMilestone =
      milestones.find((m) => week >= m.startWeek && week <= m.endWeek) ??
      milestones[milestones.length - 1];

    const sessions: StudySession[] = [];
    const isAssessmentWeek = week % 4 === 0;

    args.available_days_of_week.forEach((day, dayIndex) => {
      args.preferred_time_slots.forEach((slot, slotIndex) => {
        const sessionType: SessionType = isAssessmentWeek && slotIndex === 0
          ? "assessment"
          : assignSessionType(slot, week - 1, dayIndex);

        sessions.push({
          id: generateId(),
          day,
          slot,
          task: `[${currentMilestone.title}] ${sessionType === "deep_work"
            ? "Học chuyên sâu"
            : sessionType === "review"
            ? "Ôn tập & củng cố"
            : sessionType === "practice"
            ? "Luyện tập thực hành"
            : sessionType === "assessment"
            ? "Kiểm tra & đánh giá"
            : "Nghỉ ngơi & phản tư"}`,
          milestoneId: currentMilestone.id,
          milestoneTitle: currentMilestone.title,
          sessionType,
          estimatedDurationMinutes: sessionType === "rest_reflection" ? 30 : minutesPerSession,
          objectives: getSessionObjectives(sessionType, currentMilestone),
          techniques: getSessionTechniques(sessionType, energy),
          notes: isAssessmentWeek
            ? "⚠️ Tuần đánh giá: Đo lường tiến độ, không học nội dung mới"
            : undefined,
        });
      });
    });

    const totalMinutes = sessions.reduce((acc, s) => acc + s.estimatedDurationMinutes, 0);

    const weeklyGoals = [
      `Hoàn thành ${sessions.filter((s) => s.sessionType === "deep_work").length} phiên Deep Work`,
      `Đạt tiêu chí tuần ${week} của milestone: ${currentMilestone.title}`,
      isAssessmentWeek ? "Thực hiện self-assessment và điều chỉnh tốc độ học" : "Duy trì streak không bỏ buổi",
    ];

    const reviewPrompts = [
      "Tôi đã thực sự hiểu (không phải chỉ nhận ra) những gì đã học tuần này chưa?",
      `Tiến độ thực tế so với kế hoạch milestone '${currentMilestone.title}' là bao nhiêu %?`,
      "Điều gì đang cản trở tôi nhất? Tôi cần điều chỉnh gì cho tuần sau?",
    ];

    weeklyPlan.push({
      week,
      theme: isAssessmentWeek ? `🔍 Tuần ${week}: Đánh giá & Điều chỉnh` : `📚 Tuần ${week}: ${currentMilestone.title}`,
      focus: currentMilestone.description,
      milestoneId: currentMilestone.id,
      milestoneTitle: currentMilestone.title,
      totalStudyMinutes: totalMinutes,
      sessions,
      weeklyGoals,
      reviewPrompts,
    });
  }

  return weeklyPlan;
}

function generateProgressCheckpoints(milestones: Milestone[]): ProgressCheckpoint[] {
  return milestones.map((m) => ({
    week: m.endWeek,
    checkpointTitle: `Checkpoint: Kết thúc "${m.title}"`,
    selfAssessmentQuestions: [
      `Tôi có thể giải thích ${m.title} cho người khác hiểu không? (1–10)`,
      `Tôi đã đạt được bao nhiêu % tiêu chí thành công của milestone này?`,
      `Những deliverables nào tôi đã hoàn thành?`,
    ],
    adjustmentTriggers: [
      "Nếu < 60% tiêu chí: Thêm 1 tuần ôn tập trước khi chuyển milestone",
      "Nếu > 90% tiêu chí: Có thể rút ngắn thời gian và đẩy nhanh tiến độ",
      "Nếu thiếu động lực: Review lại lý do ban đầu và điều chỉnh workload",
    ],
  }));
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
      reason: error?.message ?? "Không thể lưu timetable vào OPFS.",
    };
  }
}

const intelligentScheduleTool: ToolDefinition = {
  type: "function",
  function: {
    name: "generate_intelligent_timetable",
    description:
      "Tạo thời gian biểu học tập cá nhân hóa cực kỳ chi tiết dạng JSON, bao gồm milestones, habits, lịch học theo tuần, checkpoints đánh giá tiến độ, và các nguyên tắc học tập hiệu quả. Lưu kết quả vào OPFS.",
    parameters: {
      type: "object",
      properties: {
        target_goal: {
          type: "string",
          description: "Mục tiêu học tập cụ thể, rõ ràng, đo lường được của người dùng.",
        },
        total_weeks: {
          type: "number",
          description: "Tổng số tuần dành cho toàn bộ lộ trình học.",
        },
        available_days_of_week: {
          type: "array",
          items: { type: "string" },
          description: "Danh sách các ngày trong tuần có thể học (vd: ['Thứ 2', 'Thứ 4', 'Thứ 7']).",
        },
        preferred_time_slots: {
          type: "array",
          items: { type: "string" },
          description: "Khung giờ học ưu tiên trong ngày (vd: ['Sáng 7–9h', 'Tối 21–22h30']).",
        },
        energy_pattern: {
          type: "string",
          enum: ["morning", "afternoon", "night"],
          description: "Thời điểm năng lượng và tập trung cao nhất trong ngày.",
        },
        productive_hours: {
          type: "array",
          items: { type: "string" },
          description: "Các khung giờ cụ thể hiệu quả nhất của người dùng.",
        },
        skill_level: {
          type: "string",
          enum: ["beginner", "intermediate", "advanced"],
          description: "Trình độ hiện tại của người dùng đối với chủ đề học.",
        },
        daily_session_limit_minutes: {
          type: "number",
          description: "Thời lượng tối đa mỗi phiên học (phút). Mặc định 90 phút.",
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
      const milestones = generateMilestones(args.target_goal, args.total_weeks);
      const habits = generateHabits(args.energy_pattern ?? "morning");
      const weeklyPlan = generateWeeklyPlan(args, milestones);
      const progressCheckpoints = generateProgressCheckpoints(milestones);

      const sessionsPerWeek = args.available_days_of_week.length * args.preferred_time_slots.length;
      const hoursPerWeek = estimateHoursPerWeek(
        args.available_days_of_week,
        args.preferred_time_slots,
        args.daily_session_limit_minutes ?? 90
      );

      const timetable: IntelligentTimetable = {
        id: generateId(),
        version: "2.0",
        createdAt: new Date().toISOString(),
        summary: {
          targetGoal: args.target_goal,
          totalWeeks: args.total_weeks,
          studyDaysPerWeek: args.available_days_of_week.length,
          sessionsPerWeek,
          estimatedHoursPerWeek: hoursPerWeek,
          totalEstimatedHours: Number((hoursPerWeek * args.total_weeks).toFixed(1)),
          energyPattern: args.energy_pattern ?? "morning",
          skillLevel: args.skill_level ?? "beginner",
        },
        learningPrinciples: [
          "🎯 Consistency over intensity – Học đều đặn mỗi ngày hiệu quả hơn học dồn cuối tuần",
          "🧠 Active Recall > Passive Re-reading – Kiểm tra bản thân > đọc lại note",
          "📈 Spaced Repetition – Ôn tập theo khoảng cách tăng dần để ghi nhớ lâu dài",
          "🔁 Deliberate Practice – Tập trung vào điểm yếu, không chỉ luyện điểm mạnh",
          "📝 Feynman Technique – Giải thích lại cho người khác = cách học sâu nhất",
          "⏱️ Parkinson's Law – Đặt deadline cứng để tránh kéo dài vô tận",
        ],
        milestones,
        habits,
        weeklyPlan,
        progressCheckpoints,
        recommendations: [
          `Với ${sessionsPerWeek} phiên/tuần (${hoursPerWeek}h), bạn sẽ hoàn thành khoảng ${(hoursPerWeek * args.total_weeks).toFixed(0)} giờ học tổng cộng — đây là nền tảng vững chắc.`,
          "Đặt alarm nhắc nhở 15 phút trước mỗi phiên học để chuẩn bị không gian và tâm lý.",
          "Ưu tiên giữ streak (chuỗi ngày liên tục) hơn là học nhiều nhưng không đều.",
          "Ghi chép bằng tay (không phải gõ máy) trong Deep Work sessions giúp tăng retention lên 40%.",
          "Cứ sau 4 tuần, dành 1 ngày review lại toàn bộ kiến thức (Big Picture Review Day).",
        ],
        contingencyRules: [
          "Bỏ lỡ 1 phiên: Không compensate — tiếp tục lịch bình thường, tránh 'debt mentality'",
          "Bỏ lỡ 2+ phiên liên tiếp: Dành 15 phút ngồi lại, xác định nguyên nhân và điều chỉnh workload",
          "Cảm thấy quá tải: Giảm 1 phiên/tuần trong 2 tuần, sau đó tăng dần trở lại",
          "Tiến độ quá chậm (<50% milestone): Extend timeline thêm 1–2 tuần thay vì bỏ cuộc",
          "Tiến độ nhanh hơn dự kiến: Thêm nội dung nâng cao vào các tuần còn lại",
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
          saveReason: saveResult.reason,
          timetable,
        },
      };
    } catch (error: any) {
      return {
        success: false,
        error: error?.message ?? "Lỗi trong quá trình khởi tạo Timetable.",
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
Bạn là **Kiến trúc sư Lộ trình Học tập Thông minh** (Intelligent Learning Architect).
Giao tiếp hoàn toàn bằng **Tiếng Việt**, thân thiện, súc tích và truyền cảm hứng.

## NHIỆM VỤ CỐT LÕI
Thu thập thông tin → Phân tích → Thiết kế thời gian biểu học tập cá nhân hóa tối ưu.

## BƯỚC 1 — THU THẬP THÔNG TIN (STRICT)
Bắt buộc thu thập ĐỦ 4 thông tin CHÍNH (required) trước khi gọi tool:

| # | Tham số | Câu hỏi gợi ý |
|---|---------|----------------|
| 1 | \`target_goal\` | Mục tiêu học tập cụ thể là gì? (VD: "Học lập trình Python từ cơ bản đến làm được project") |
| 2 | \`total_weeks\` | Bạn muốn hoàn thành trong bao nhiêu tuần? |
| 3 | \`available_days_of_week\` | Các ngày nào trong tuần bạn có thể học? (VD: Thứ 2, 4, 6, 7) |
| 4 | \`preferred_time_slots\` | Khung giờ nào trong ngày bạn muốn học? (VD: Sáng 7–9h, Tối 21–23h) |

Và 3 thông tin PHỤ giúp tối ưu hóa lịch (tùy chọn nhưng hãy hỏi nếu chưa có):

| # | Tham số | Câu hỏi gợi ý |
|---|---------|----------------|
| 5 | \`energy_pattern\` | Bạn tập trung tốt nhất vào lúc: sáng / chiều / tối? |
| 6 | \`skill_level\` | Trình độ hiện tại của bạn với chủ đề này: mới bắt đầu / trung cấp / nâng cao? |
| 7 | \`daily_session_limit_minutes\` | Mỗi phiên học bạn muốn học tối đa bao nhiêu phút? (Mặc định: 90 phút) |

## BƯỚC 2 — QUY TẮC KÍCH HOẠT TOOL
✅ CHỈ gọi \`generate_intelligent_timetable\` khi đã có ĐỦ 4 thông tin bắt buộc.
❌ TUYỆT ĐỐI KHÔNG tự suy diễn, tự điền mặc định cho bất kỳ tham số bắt buộc nào.
❌ Nếu thiếu thông tin → Hỏi thêm, KHÔNG gọi tool.
✅ Nếu đã có đủ thông tin (user nêu rõ trong 1 lần) → Gọi tool ngay, không hỏi thêm.

Khi hỏi thông tin còn thiếu: hỏi TỐI ĐA 2 câu một lượt, ngắn gọn, cụ thể.

## BƯỚC 3 — SAU KHI TẠO TIMETABLE
Sau khi tool trả về kết quả, trình bày cho người dùng theo cấu trúc sau:

1. **Tổng quan nhanh**: Tóm tắt lịch học (X tuần, Y phiên/tuần, Z giờ/tuần)
2. **Lộ trình Milestones**: Liệt kê 4 giai đoạn chính và thời gian
3. **Lịch học mẫu tuần đầu**: Hiển thị chi tiết Tuần 1 để người dùng hình dung
4. **3 thói quen quan trọng nhất** cần thiết lập ngay
5. **Lời khuyên cá nhân**: Dựa trên energy pattern và mục tiêu cụ thể của họ

Kết thúc bằng 1 câu động viên ngắn, chân thành.

## PHONG CÁCH GIAO TIẾP
- Thân thiện như người bạn đồng hành, không phải robot
- Sử dụng emoji có chọn lọc để làm rõ cấu trúc (không lạm dụng)
- Tránh giải thích dài dòng không cần thiết
- Khi người dùng cung cấp thông tin → xác nhận ngắn gọn rồi hỏi tiếp
- Luôn ghi nhận effort của người dùng khi họ chia sẻ mục tiêu
`,

  tools: [intelligentScheduleTool],
  executors: [intelligentScheduleExecutor],
};