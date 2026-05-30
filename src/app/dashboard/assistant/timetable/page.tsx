"use client";

import { Sparkles, CheckCircle2, AlertTriangle, BookOpen, Clock, Target, ShieldAlert, Award } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

// --- INTERFACES ĐỒNG BỘ JSON V2.0 ---
interface StudySession {
  id: string;
  day: string;
  slot: string;
  task: string;
  milestoneId: string;
  milestoneTitle: string;
  sessionType: string;
  estimatedDurationMinutes: number;
  objectives?: string[];
  techniques?: string[];
}

interface WeeklyPlan {
  week: number;
  theme?: string;
  focus: string;
  milestoneId?: string;
  milestoneTitle?: string;
  totalStudyMinutes?: number;
  sessions: StudySession[];
  weeklyGoals?: string[];
  reviewPrompts?: string[];
}

interface Milestone {
  id: string;
  order?: number;
  title: string;
  description: string;
  startWeek?: number;
  endWeek?: number;
  estimatedWeeks: number;
  priority: "high" | "medium" | "low";
  successCriteria?: string[];
  deliverables?: string[];
}

interface Habit {
  id: string;
  name: string;
  frequency: string;
  trigger: string;
  minimumAction: string;
  habitStack?: string;
  reward?: string;
}

interface IntelligentTimetable {
  id: string;
  version?: string;
  createdAt: string;
  summary: {
    targetGoal: string;
    totalWeeks: number;
    studyDaysPerWeek: number;
    sessionsPerWeek?: number;
    estimatedHoursPerWeek: number;
    totalEstimatedHours?: number;
    energyPattern?: string;
    skillLevel?: string;
  };
  learningPrinciples?: string[];
  milestones: Milestone[];
  habits: Habit[];
  weeklyPlan: WeeklyPlan[];
  recommendations: string[];
  contingencyRules?: string[];
}

export default function TimeTable() {
  const [fileList, setFileList] = useState<string[]>([]);
  const [selectedFilename, setSelectedFilename] = useState<string>("");
  const [timetable, setTimetable] = useState<IntelligentTimetable | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadFileList() {
      if (typeof navigator === "undefined" || !navigator.storage) {
        setError("Trình duyệt không hỗ trợ lưu trữ OPFS.");
        return;
      }
      try {
        const root = await navigator.storage.getDirectory();
        const dir = await root.getDirectoryHandle("ai-learning-system", { create: true });
        const files: string[] = [];
        
        for await (const entry of dir.values()) {
          if (entry.kind === "file" && entry.name.endsWith(".json")) {
            files.push(entry.name);
          }
        }

        files.sort((a, b) => b.localeCompare(a));
        setFileList(files);
      } catch (err: any) {
        console.error(err);
        setError("Không thể quét thư mục OPFS.");
      }
    }
    loadFileList();
  }, []);

  useEffect(() => {
    async function fetchTimetableContent() {
      if (!selectedFilename) {
        setTimetable(null);
        return;
      }
      setLoading(true);
      setError(null);
      try {
        const root = await navigator.storage.getDirectory();
        const dir = await root.getDirectoryHandle("ai-learning-system");
        const fileHandle = await dir.getFileHandle(selectedFilename);
        const file = await fileHandle.getFile();
        const text = await file.text();
        const data = JSON.parse(text) as IntelligentTimetable;
        setTimetable(data);
      } catch (err: any) {
        setError("Lỗi khi đọc dữ liệu file hoặc định dạng JSON sai.");
        setTimetable(null);
      } finally {
        setLoading(false);
      }
    }
    fetchTimetableContent();
  }, [selectedFilename]);

  return (
    <div 
      className="flex flex-col gap-6 p-6 min-h-screen w-full bg-[#f7f9f8] text-[#262626]" 
      style={{ fontFamily: "'Nunito', sans-serif" }}
    >
      {/* HEADER BAR */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 bg-white border border-[#e5e7e6] rounded-2xl shadow-xs">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-[#1a1a1a]">Hệ Thống Lịch Trình Thông Minh</h1>
          <p className="text-sm text-[#717B7A]">Quản lý và tra cứu lộ trình học tập local-first qua OPFS</p>
        </div>
        
        <div className="flex items-center gap-2">
          <label htmlFor="timetable-select" className="text-sm font-medium text-[#525958] whitespace-nowrap">
            Chọn lộ trình:
          </label>
          <select
            id="timetable-select"
            value={selectedFilename}
            onChange={(e) => setSelectedFilename(e.target.value)}
            className="block w-full sm:w-64 px-3 py-2 bg-white border border-[#cbd5e1] rounded-xl text-sm focus:outline-hidden focus:border-[#00E5FF] focus:ring-1 focus:ring-[#00E5FF] cursor-pointer transition-all"
          >
            <option value="">-- Để trống / Chọn một file --</option>
            {fileList.map((filename) => (
              <option key={filename} value={filename}>
                {filename.replace("timetable-", "").replace(".json", "")}
              </option>
            ))}
          </select>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-600 rounded-xl text-sm">
          {error}
        </div>
      )}

      {loading && (
        <div className="flex items-center justify-center p-12 text-[#717B7A] text-sm font-medium">
          Đang tải cấu trúc dữ liệu từ OPFS...
        </div>
      )}

      {/* EMPTY STATE */}
      {!timetable && !loading && !error && (
        <div className="flex flex-col items-center justify-center border-2 border-dashed border-[#cbd5e1] rounded-2xl p-16 bg-white">
          <p className="text-[#2d3436] font-semibold text-base">
            Chưa có thời gian biểu nào được chọn để hiển thị.
          </p>
          <p className="text-sm text-[#2d3436]/70 mt-2">
            Vui lòng chọn thời gian biểu từ dropdown phía trên.
          </p>
          <div className="mt-6">
            <Link 
              href="/dashboard/goal" 
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#FF3399] hover:bg-[#00cec9] text-white font-medium text-sm rounded-xl shadow-sm hover:shadow-md active:scale-95 transition-all duration-200 group"
            >
              <Sparkles className="w-4 h-4 transition-transform group-hover:animate-pulse" />
              <span>Tạo mới thời gian biểu với agent</span>
            </Link>
          </div>
        </div>
      )}

      {/* MAIN TIMETABLE DASHBOARD */}
      {timetable && !loading && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* CARD 1: SUMMARY INFO */}
          <div className="bg-white border border-[#e5e7e6] p-6 rounded-2xl shadow-xs flex flex-col justify-between">
            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-[#717B7A] mb-1 flex items-center gap-1">
                <Target className="w-3.5 h-3.5" /> Mục tiêu hiện tại {timetable.version && `(v${timetable.version})`}
              </div>
              <h2 className="text-2xl font-black text-[#1a1a1a] leading-tight mb-4">{timetable.summary.targetGoal}</h2>
              
              <div className="space-y-1.5 text-xs text-[#525958] border-t border-[#f0f2f1] pt-3">
                {timetable.summary.skillLevel && <p>• Trình độ đầu vào: <span className="font-bold text-[#1a1a1a] capitalize">{timetable.summary.skillLevel}</span></p>}
                {timetable.summary.energyPattern && <p>• Điểm neo năng lượng: <span className="font-bold text-[#00b4cc] capitalize">{timetable.summary.energyPattern}</span></p>}
                {timetable.summary.totalEstimatedHours && <p>• Tổng thời lượng dự kiến: <span className="font-bold text-[#1a1a1a]">{timetable.summary.totalEstimatedHours} giờ</span></p>}
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 pt-4 border-t border-[#f0f2f1] mt-4">
              <div className="bg-[#f8fafc] p-2.5 rounded-xl text-center">
                <span className="block text-lg font-bold text-[#1a1a1a]">{timetable.summary.totalWeeks}</span>
                <span className="text-[10px] text-[#717B7A] font-medium block">Tổng số tuần</span>
              </div>
              <div className="bg-[#f8fafc] p-2.5 rounded-xl text-center">
                <span className="block text-lg font-bold text-[#1a1a1a]">{timetable.summary.studyDaysPerWeek}</span>
                <span className="text-[10px] text-[#717B7A] font-medium block">Ngày / Tuần</span>
              </div>
              <div className="bg-[#f8fafc] p-2.5 rounded-xl text-center">
                <span className="block text-lg font-bold text-[#00b4cc]">{timetable.summary.estimatedHoursPerWeek}h</span>
                <span className="text-[10px] text-[#717B7A] font-medium block">Ước tính / T</span>
              </div>
            </div>
          </div>

          {/* CARD 2: HABIT SYSTEM */}
          <div className="bg-white border border-[#e5e7e6] p-6 rounded-2xl shadow-xs">
            <div className="text-xs font-bold uppercase tracking-wider text-[#717B7A] mb-3 flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" /> Hệ thống Thói quen (Habit System)
            </div>
            <div className="space-y-3 max-h-[320px] overflow-y-auto pr-1">
              {timetable.habits.map((habit) => (
                <div key={habit.id} className="p-3 bg-[#f8fafc] border border-[#f0f2f1] rounded-xl text-sm">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-[#1a1a1a]">{habit.name}</span>
                    <span className="px-2 py-0.5 text-[10px] bg-emerald-50 text-emerald-700 rounded-md font-bold capitalize">{habit.frequency}</span>
                  </div>
                  <p className="text-[11px] text-[#525958]"><span className="font-semibold text-slate-500">Kích hoạt:</span> {habit.trigger}</p>
                  {habit.habitStack && <p className="text-[11px] text-[#717B7A] italic"><span className="font-semibold text-slate-500">Chồng thói quen:</span> {habit.habitStack}</p>}
                  <p className="text-xs text-[#00b4cc] font-semibold mt-1">⚡ {habit.minimumAction}</p>
                </div>
              ))}
            </div>
          </div>

          {/* CARD 3: AGENT RECOMMENDATIONS & METADATA */}
          <div className="bg-[#1a1a1a] text-white p-6 rounded-2xl shadow-xs flex flex-col justify-between">
            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-[#717B7A] mb-3 flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-[#00E5FF]" /> Khuyến nghị từ Kiến trúc sư
              </div>
              <ul className="space-y-2 text-xs text-slate-300 max-h-[260px] overflow-y-auto pr-1">
                {timetable.recommendations.map((rec, index) => (
                  <li key={index} className="flex gap-2 items-start">
                    <span className="text-[#00E5FF] font-bold">✓</span>
                    <span>{rec}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="text-[10px] text-slate-500 mt-4 pt-2 border-t border-neutral-800 flex justify-between items-center">
              <span>Khởi tạo: {new Date(timetable.createdAt).toLocaleString("vi-VN")}</span>
            </div>
          </div>

          {/* BLOCK 4: CORE LEARNING PRINCIPLES */}
          {timetable.learningPrinciples && timetable.learningPrinciples.length > 0 && (
            <div className="md:col-span-3 bg-[#fdfdfd] border border-[#e5e7e6] p-6 rounded-2xl shadow-xs">
              <div className="text-xs font-bold uppercase tracking-wider text-[#717B7A] mb-3 flex items-center gap-1">
                <BookOpen className="w-3.5 h-3.5" /> Nguyên lý học tập cốt lõi (Core Learning Principles)
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {timetable.learningPrinciples.map((principle, index) => (
                  <div key={index} className="p-3 bg-white border border-[#f0f2f1] rounded-xl text-xs text-[#334155] font-medium shadow-2xs">
                    {principle}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* BLOCK 5: MILESTONES ROADMAP */}
          <div className="md:col-span-3 bg-white border border-[#e5e7e6] p-6 rounded-2xl shadow-xs">
            <div className="text-xs font-bold uppercase tracking-wider text-[#717B7A] mb-4 flex items-center gap-1">
              <Award className="w-3.5 h-3.5" /> Các mốc lộ trình chính (Milestones)
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
              {timetable.milestones.map((milestone, idx) => (
                <div key={milestone.id} className="relative p-4 bg-[#f8fafc] border border-[#f0f2f1] rounded-xl flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-extrabold text-[#717B7A] bg-slate-200 px-2 py-0.5 rounded-sm">
                        Mốc {milestone.order || idx + 1}
                      </span>
                      <span className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded ${
                        milestone.priority === 'high' ? 'bg-red-50 text-red-600' : 'bg-amber-50 text-amber-600'
                      }`}>
                        {milestone.priority}
                      </span>
                    </div>
                    
                    <h3 className="font-bold text-sm text-[#1a1a1a] mb-1">{milestone.title}</h3>
                    <p className="text-xs text-[#525958] leading-relaxed mb-3">{milestone.description}</p>
                    
                    {/* Render Success Criteria & Deliverables if exist */}
                    {milestone.successCriteria && (
                      <div className="mb-2 pt-2 border-t border-dashed border-slate-200">
                        <span className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Tiêu chí thành công:</span>
                        <ul className="text-[11px] text-[#525958] space-y-0.5 list-disc pl-3.5">
                          {milestone.successCriteria.map((sc, i) => <li key={i}>{sc}</li>)}
                        </ul>
                      </div>
                    )}
                    
                    {milestone.deliverables && (
                      <div className="mb-3">
                        <span className="text-[10px] font-bold text-slate-500 uppercase block mb-0.5">Sản phẩm đầu ra:</span>
                        <div className="flex flex-wrap gap-1">
                          {milestone.deliverables.map((dl, i) => (
                            <span key={i} className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded-sm">{dl}</span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="text-[11px] font-medium text-slate-400 pt-2 border-t border-slate-100 mt-2">
                    Tuần: <span className="text-[#1a1a1a] font-bold">{milestone.startWeek}-{milestone.endWeek}</span> ({milestone.estimatedWeeks} tuần)
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* BLOCK 6: WEEKLY DETAILED SESSIONS */}
          <div className="md:col-span-3 bg-white border border-[#e5e7e6] p-6 rounded-2xl shadow-xs">
            <div className="text-xs font-bold uppercase tracking-wider text-[#717B7A] mb-4 flex items-center gap-1">
              <BookOpen className="w-3.5 h-3.5" /> Chi tiết lịch học theo từng tuần
            </div>
            <div className="space-y-6">
              {timetable.weeklyPlan.map((plan) => (
                <div key={plan.week} className="border border-[#e5e7e6] rounded-xl overflow-hidden bg-white">
                  
                  {/* Weekly Header Banner */}
                  <div className="bg-[#f8fafc] border-b border-[#e5e7e6] px-4 py-3 flex flex-col lg:flex-row lg:items-center justify-between gap-2">
                    <div>
                      <span className="inline-block px-2 py-0.5 text-xs bg-[#1a1a1a] text-white font-extrabold rounded-md mr-2">
                        Tuần {plan.week}
                      </span>
                      <span className="text-sm font-bold text-[#1a1a1a]">
                        {plan.theme || plan.milestoneTitle || "Kế hoạch tuần"}
                      </span>
                    </div>
                    <div className="text-xs text-[#717B7A] max-w-xl lg:text-right">
                      💡 <span className="font-semibold">Focus:</span> {plan.focus}
                    </div>
                  </div>
                  
                  {/* Study Grid Sessions */}
                  <div className="p-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                    {plan.sessions.map((session) => (
                      <div key={session.id} className="p-3 border border-[#f0f2f1] bg-[#fafbfc] rounded-xl hover:border-[#00E5FF] transition-all flex flex-col justify-between">
                        <div>
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-xs font-extrabold text-[#1a1a1a] bg-slate-200 px-2 py-0.5 rounded-sm">{session.day}</span>
                            <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-sm uppercase ${
                              session.sessionType === 'deep_work' ? 'bg-indigo-50 text-indigo-600' : 'bg-amber-50 text-amber-600'
                            }`}>
                              {session.sessionType === 'deep_work' ? '⚡ Deep Work' : '🔄 Review'}
                            </span>
                          </div>
                          <p className="text-xs font-bold text-slate-700 line-clamp-2 mb-2">{session.task}</p>
                          
                          {/* Objectives & Techniques inside session */}
                          {session.objectives && (
                            <div className="text-[10px] text-slate-500 mb-1.5">
                              {session.objectives.map((obj, idx) => <p key={idx} className="line-clamp-1">• {obj}</p>)}
                            </div>
                          )}
                          {session.techniques && (
                            <div className="flex flex-wrap gap-0.5 mt-1">
                              {session.techniques.map((tech, idx) => (
                                <span key={idx} className="text-[9px] bg-teal-50 text-teal-700 px-1 rounded-sm">{tech}</span>
                              ))}
                            </div>
                          )}
                        </div>

                        <div className="flex items-center justify-between mt-3 pt-2 border-t border-dashed border-slate-200 text-[10px] text-[#717B7A]">
                          <span>⏰ <strong className="text-slate-800">{session.slot}</strong></span>
                          <span>⏳ <strong>{session.estimatedDurationMinutes}p</strong></span>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Weekly Footnote (Goals & Review Prompts) */}
                  {(plan.weeklyGoals || plan.reviewPrompts) && (
                    <div className="bg-[#fdfdfd] border-t border-[#e5e7e6] p-3 text-xs grid grid-cols-1 md:grid-cols-2 gap-4">
                      {plan.weeklyGoals && (
                        <div>
                          <span className="font-bold text-slate-600 text-[11px] block mb-1 uppercase tracking-tight">🎯 Mục tiêu tuần:</span>
                          <ul className="list-disc pl-4 text-slate-600 space-y-0.5">
                            {plan.weeklyGoals.map((goal, gIdx) => <li key={gIdx}>{goal}</li>)}
                          </ul>
                        </div>
                      )}
                      {plan.reviewPrompts && (
                        <div>
                          <span className="font-bold text-slate-600 text-[11px] block mb-1 uppercase tracking-tight">🧐 Câu hỏi nghiệm thu cuối tuần:</span>
                          <ul className="list-decimal pl-4 text-slate-500 italic space-y-0.5">
                            {plan.reviewPrompts.map((prompt, pIdx) => <li key={pIdx}>{prompt}</li>)}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}

                </div>
              ))}
            </div>
          </div>

          {/* BLOCK 7: CONTINGENCY RULES (KẾ HOẠCH DỰ PHÒNG KHI BỂ LỊCH) */}
          {timetable.contingencyRules && timetable.contingencyRules.length > 0 && (
            <div className="md:col-span-3 bg-red-950/5 border border-red-200 p-6 rounded-2xl shadow-xs">
              <div className="text-xs font-bold uppercase tracking-wider text-red-800 mb-3 flex items-center gap-1">
                <ShieldAlert className="w-3.5 h-3.5 text-red-700" /> Kế hoạch dự phòng rủi ro (Contingency Rules / Kháng vỡ kế hoạch)
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {timetable.contingencyRules.map((rule, index) => (
                  <div key={index} className="p-3 bg-white border border-red-100 rounded-xl text-xs text-red-900 flex gap-2 items-start shadow-2xs">
                    <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                    <span>{rule}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      )}
    </div>
  );
}