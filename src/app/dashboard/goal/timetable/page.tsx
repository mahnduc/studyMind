"use client";

import { useEffect, useState } from "react";

// Định nghĩa lại Type khớp với dữ liệu JSON được lưu từ Agent
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

export default function TimeTable() {
  const [fileList, setFileList] = useState<string[]>([]);
  const [selectedFilename, setSelectedFilename] = useState<string>("");
  const [timetable, setTimetable] = useState<IntelligentTimetable | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // 1. Quét danh sách các file timetable (.json) có trong thư mục OPFS
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
        
        // Duyệt qua toàn bộ entries trong thư mục
        for await (const entry of dir.values()) {
          if (entry.kind === "file" && entry.name.endsWith(".json")) {
            files.push(entry.name);
          }
        }
        // Sắp xếp file mới nhất lên đầu dựa theo timestamp trong tên file (timetable-timestamp.json)
        files.sort((a, b) => b.localeCompare(a));
        setFileList(files);
      } catch (err: any) {
        console.error(err);
        setError("Không thể quét thư mục OPFS.");
      }
    }
    loadFileList();
  }, []);

  // 2. Đọc nội dung file JSON khi người dùng chọn từ Dropdown
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
      {/* Top Header & Dropdown Selector Selector Control */}
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
                {filename.replace("timetable-", "").replace(".json", "")} ({filename})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Trạng thái lỗi hoặc chưa chọn dữ liệu */}
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

      {!timetable && !loading && !error && (
        <div className="flex flex-col items-center justify-center border-2 border-dashed border-[#cbd5e1] rounded-2xl p-16 bg-white">
          <p className="text-[#717B7A] font-medium">Chưa có thời gian biểu nào được chọn để hiển thị.</p>
          <p className="text-xs text-[#94a3b8] mt-1">Vui lòng chọn một file từ dropdown phía trên để phân tích cấu trúc.</p>
        </div>
      )}

      {/* GIAO DIỆN BENTO GRID CHÍNH KHI ĐÃ CÓ DỮ LIỆU */}
      {timetable && !loading && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Ô 1: Tổng quan mục tiêu (Summary Dashboard) */}
          <div className="bg-white border border-[#e5e7e6] p-6 rounded-2xl shadow-xs flex flex-col justify-between">
            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-[#717B7A] mb-1">Mục tiêu hiện tại</div>
              <h2 className="text-2xl font-black text-[#1a1a1a] leading-tight mb-4">{timetable.summary.targetGoal}</h2>
            </div>
            <div className="grid grid-cols-3 gap-2 pt-4 border-t border-[#f0f2f1]">
              <div className="bg-[#f8fafc] p-3 rounded-xl text-center">
                <span className="block text-xl font-bold text-[#1a1a1a]">{timetable.summary.totalWeeks}</span>
                <span className="text-[10px] text-[#717B7A] font-medium">Tổng số tuần</span>
              </div>
              <div className="bg-[#f8fafc] p-3 rounded-xl text-center">
                <span className="block text-xl font-bold text-[#1a1a1a]">{timetable.summary.studyDaysPerWeek}</span>
                <span className="text-[10px] text-[#717B7A] font-medium">Ngày / Tuần</span>
              </div>
              <div className="bg-[#f8fafc] p-3 rounded-xl text-center">
                <span className="block text-xl font-bold text-[#00b4cc]">{timetable.summary.estimatedHoursPerWeek}h</span>
                <span className="text-[10px] text-[#717B7A] font-medium">Ước tính / Tuần</span>
              </div>
            </div>
          </div>

          {/* Ô 2: Hệ thống Thói quen hành động (Habit System) */}
          <div className="bg-white border border-[#e5e7e6] p-6 rounded-2xl shadow-xs">
            <div className="text-xs font-bold uppercase tracking-wider text-[#717B7A] mb-3">Hệ thống Thói quen (Habit System)</div>
            <div className="space-y-3">
              {timetable.habits.map((habit) => (
                <div key={habit.id} className="p-3 bg-[#f8fafc] border border-[#f0f2f1] rounded-xl text-sm">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-[#1a1a1a]">{habit.name}</span>
                    <span className="px-2 py-0.5 text-[10px] bg-emerald-50 text-emerald-700 rounded-md font-bold capitalize">{habit.frequency}</span>
                  </div>
                  <p className="text-xs text-[#525958]"><span className="font-semibold text-slate-500">Kích hoạt:</span> {habit.trigger}</p>
                  <p className="text-xs text-[#00b4cc] font-semibold mt-1">⚡ {habit.minimumAction}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Ô 3: Lời khuyên tối ưu (Recommendations) */}
          <div className="bg-[#1a1a1a] text-white p-6 rounded-2xl shadow-xs flex flex-col justify-between">
            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-[#717B7A] mb-3">Khuyến nghị từ Kiến trúc sư</div>
              <ul className="space-y-2 text-sm text-slate-300">
                {timetable.recommendations.map((rec, index) => (
                  <li key={index} className="flex gap-2 items-start">
                    <span className="text-[#00E5FF] font-bold">✓</span>
                    <span>{rec}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="text-[10px] text-slate-500 mt-4 pt-2 border-t border-neutral-800">
              Khởi tạo: {new Date(timetable.createdAt).toLocaleString("vi-VN")}
            </div>
          </div>

          {/* Ô lớn 4: Lộ trình Chi tiết từng mốc (Milestones Breakdown) */}
          <div className="md:col-span-3 bg-white border border-[#e5e7e6] p-6 rounded-2xl shadow-xs">
            <div className="text-xs font-bold uppercase tracking-wider text-[#717B7A] mb-4">Các mốc lộ trình chính (Milestones)</div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {timetable.milestones.map((milestone, idx) => (
                <div key={milestone.id} className="relative p-4 bg-[#f8fafc] border border-[#f0f2f1] rounded-xl flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-extrabold text-[#717B7A] bg-slate-200 px-2 py-0.5 rounded-sm">Mốc {idx + 1}</span>
                      <span className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded ${
                        milestone.priority === 'high' ? 'bg-red-50 text-red-600' : 'bg-amber-50 text-amber-600'
                      }`}>
                        {milestone.priority}
                      </span>
                    </div>
                    <h3 className="font-bold text-[#1a1a1a] mb-1">{milestone.title}</h3>
                    <p className="text-xs text-[#525958] leading-relaxed mb-4">{milestone.description}</p>
                  </div>
                  <div className="text-xs font-medium text-slate-400">
                    Thời lượng dự kiến: <span className="text-[#1a1a1a] font-bold">{milestone.estimatedWeeks} tuần</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Ô lớn 5: Lịch trình chi tiết từng tuần & Phiên học (Weekly Schedule Blocks) */}
          <div className="md:col-span-3 bg-white border border-[#e5e7e6] p-6 rounded-2xl shadow-xs">
            <div className="text-xs font-bold uppercase tracking-wider text-[#717B7A] mb-4">Chi tiết lịch học theo từng tuần</div>
            <div className="space-y-6">
              {timetable.weeklyPlan.map((plan) => (
                <div key={plan.week} className="border border-[#e5e7e6] rounded-xl overflow-hidden bg-white">
                  {/* Header của tuần */}
                  <div className="bg-[#f8fafc] border-b border-[#e5e7e6] px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <span className="inline-block px-2 py-0.5 text-xs bg-[#1a1a1a] text-white font-extrabold rounded-md mr-2">Tuần {plan.week}</span>
                      <span className="text-sm font-bold text-[#1a1a1a]">{plan.milestone}</span>
                    </div>
                    <div className="text-xs text-[#717B7A] italic">💡 {plan.focus}</div>
                  </div>
                  
                  {/* Danh sách các Sessions học trong tuần */}
                  <div className="p-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                    {plan.sessions.map((session) => (
                      <div key={session.id} className="p-3 border border-[#f0f2f1] bg-[#fafbfc] rounded-xl hover:border-[#00E5FF] transition-all">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-xs font-extrabold text-[#1a1a1a] bg-slate-200 px-2 py-0.5 rounded-sm">{session.day}</span>
                          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-sm ${
                            session.sessionType === 'deep_work' ? 'bg-indigo-50 text-indigo-600' : 'bg-amber-50 text-amber-600'
                          }`}>
                            {session.sessionType === 'deep_work' ? '⚡ Deep Work' : '🔄 Review'}
                          </span>
                        </div>
                        <p className="text-xs font-bold text-slate-700 truncate mb-1">{session.task}</p>
                        <div className="flex items-center justify-between mt-3 pt-2 border-t border-dashed border-slate-100 text-[11px] text-[#717B7A]">
                          <span>⏰ Khung giờ: <strong className="text-slate-800">{session.slot}</strong></span>
                          <span>⏳ <strong>{session.estimatedDurationMinutes}p</strong></span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      )}
    </div>
  );
}