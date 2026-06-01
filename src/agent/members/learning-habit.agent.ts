import {
  AgentConfig,
  ToolDefinition,
  ToolExecutor,
  ToolResult,
  AgentSession,
} from "../core/types";

export interface XpLog {
  timestamp: string;
  amount: number;
}

export interface UserProfile {
  username: string;
  updatedAt: string;
  totalXp: number;
  dailyXp: Record<string, XpLog[]>;
}

export interface LearningStats {
  totalXp: number;
  currentLevel: number;
  activeDays: number;
  streakDays: number;
  todayXp: number;
  last7DaysXp: number;
  last30DaysXp: number;
  averageDailyXp: number;
  bestDayXp: number;
  trend: "up" | "down" | "stable";
}

const analyzeLearningStatsTool: ToolDefinition = {
  type: "function",
  function: {
    name: "analyze_learning_stats",
    description: "Analyze learning activity from XP history",
    parameters: {
      type: "object",
      properties: {},
    },
  },
};

function calculateLevel(totalXp: number): number {
  if (totalXp <= 0) return 1;
  return Math.floor(Math.sqrt(totalXp / 100)) + 1;
}

function getDateString(date: Date): string {
  return date.toLocaleDateString("sv-SE");
}

function calculateStreak(dailyXp: Record<string, XpLog[]>): number {
  let streak = 0;
  const today = new Date();

  while (true) {
    const d = new Date(today);
    d.setDate(today.getDate() - streak);
    const key = getDateString(d);

    if (dailyXp[key]) {
      streak++;
    } else {
      break;
    }
  }
  return streak;
}

export const analyzeLearningStatsExecutor: ToolExecutor = {
  name: "analyze_learning_stats",

  async execute(args: any, session: AgentSession): Promise<ToolResult> {
    try {
      const profile = session.collectedData.profile as UserProfile;

      if (!profile) {
        return {
          success: false,
          error: "Profile not found",
        };
      }

      const dailyXp = profile.dailyXp;
      const dates = Object.keys(dailyXp).sort();

      const dailyTotals = dates.map((date) => ({
        date,
        xp: dailyXp[date].reduce((sum, log) => sum + log.amount, 0),
      }));

      const totalXp = profile.totalXp;
      const currentLevel = calculateLevel(totalXp);
      const activeDays = dailyTotals.length;
      const today = getDateString(new Date());

      const todayXp = dailyTotals.find((d) => d.date === today)?.xp ?? 0;
      const last7DaysXp = dailyTotals.slice(-7).reduce((sum, d) => sum + d.xp, 0);
      const last30DaysXp = dailyTotals.slice(-30).reduce((sum, d) => sum + d.xp, 0);

      const averageDailyXp = activeDays > 0 ? Math.round(last30DaysXp / activeDays) : 0;
      const bestDayXp = Math.max(...dailyTotals.map((d) => d.xp), 0);
      const streakDays = calculateStreak(dailyXp);

      let trend: "up" | "down" | "stable" = "stable";

      if (dailyTotals.length >= 14) {
        const previousWeek = dailyTotals.slice(-14, -7).reduce((sum, d) => sum + d.xp, 0);
        const currentWeek = dailyTotals.slice(-7).reduce((sum, d) => sum + d.xp, 0);

        if (currentWeek > previousWeek * 1.15) {
          trend = "up";
        } else if (currentWeek < previousWeek * 0.85) {
          trend = "down";
        }
      }

      const stats: LearningStats = {
        totalXp,
        currentLevel,
        activeDays,
        streakDays,
        todayXp,
        last7DaysXp,
        last30DaysXp,
        averageDailyXp,
        bestDayXp,
        trend,
      };

      return {
        success: true,
        data: stats,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error?.message ?? "Analyze failed",
      };
    }
  },
};

export const LEARNING_HABIT_COACH_PROMPT = `You are a Learning Habit Coach.

You DO NOT know the user's subject.
You only know:
- XP history
- Daily activity
- Study consistency
- Study trends

Your job:
1. Analyze learning habits.
2. Detect inactivity.
3. Detect improvement.
4. Detect burnout risk.
5. Encourage consistency.
6. Celebrate achievements.
7. Give practical study habit advice.

Never pretend to know:
- subjects
- exams
- knowledge level

Focus only on:
- consistency
- motivation
- learning rhythm
- streaks
- discipline
- habit formation

Always explain your reasoning using actual XP statistics.`;

export const learningHabitCoachAgent: AgentConfig = {
  model: "llama-3.3-70b-versatile",
  temperature: 0.7,
  maxSteps: 3,
  maxTokens: 1500,
  systemPrompt: LEARNING_HABIT_COACH_PROMPT,
  tools: [analyzeLearningStatsTool],
  executors: [analyzeLearningStatsExecutor],
};