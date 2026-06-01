"use client";

import { Sparkles, CheckCircle2, AlertTriangle, BookOpen, Clock, Target, Award, ArrowRight } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

// --- INTERFACES ĐỒNG BỘ 100% VỚI JSON CỦA CẬU ---
interface TimetableTask {
  day: string;
  focusTopic: string;
  durationMinutes: number;
  actionItems: string[];
  weakTopicStrategies: string[];
  expectedImprovement: string;
}

interface QuizTimetablePayload {
  timetableName: string;
  quizTitle: string;
  createdAt: string;
  overallStrategySummary: string;
  targetedWeakTopics: string[];
  schedule: TimetableTask[];
}

export default function TimeTable() {
  const [fileList, setFileList] = useState<string[]>([]);
  const [selectedFilename, setSelectedFilename] = useState<string>("");
  const [timetable, setTimetable] = useState<QuizTimetablePayload | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // 1. Quét danh sách các file cấu hình trong thư mục "timetable" của OPFS
  useEffect(() => {
    async function loadFileList() {
      if (typeof navigator === "undefined" || !navigator.storage) {
        setError("Trình duyệt hiện tại không hỗ trợ API lưu trữ OPFS.");
        return;
      }
      try {
        const root = await navigator.storage.getDirectory();
        const dir = await root.getDirectoryHandle("timetable", { create: true });
        const files: string[] = [];
        
        for await (const entry of dir.values()) {
          if (entry.kind === "file" && entry.name.endsWith(".json")) {
            files.push(entry.name);
          }
        }

        // Sắp xếp file mới nhất lên đầu
        files.sort((a, b) => b.localeCompare(a));
        setFileList(files);
      } catch (err: any) {
        console.error("OPFS Scan Error:", err);
        setError("Không thể truy cập hoặc quét thư mục 'timetable' trong hệ thống lưu trữ.");
      }
    }
    loadFileList();
  }, []);

  // 2. Đọc và parse nội dung JSON từ file được chọn
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
        const dir = await root.getDirectoryHandle("timetable", { create: false });
        const fileHandle = await dir.getFileHandle(selectedFilename);
        const file = await fileHandle.getFile();
        const text = await file.text();
        
        if (!text.trim()) {
          throw new Error("File rỗng hoặc không có dữ liệu văn bản.");
        }

        const data = JSON.parse(text) as QuizTimetablePayload;
        setTimetable(data);
      } catch (err: any) {
        console.error("OPFS Read Error:", err);
        setError(`Không thể xử lý tệp tin [${selectedFilename}]. Định dạng JSON không tương thích hoặc file bị hỏng.`);
        setTimetable(null);
      } finally {
        setLoading(false); // Đã sửa lỗi typo Loading(false) gây crash UI ở đây
      }
    }
    fetchTimetableContent();
  }, [selectedFilename]);

  // Hàm helper format ngày tháng an toàn phòng trường hợp chuỗi string date không chuẩn ISO
  const formatDateTime = (dateStr: string) => {
    try {
      const parsedDate = new Date(dateStr.replace(/-/g, "/")); // Chuyển đổi an toàn cho mọi trình duyệt
      if (isNaN(parsedDate.getTime())) return dateStr; 
      return parsedDate.toLocaleString("vi-VN", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit"
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div 
      className="flex flex-col gap-6 p-6 min-h-screen w-full bg-[#f8fafc] text-[#1e293b]"
      style={{ fontFamily: "'Nunito', sans-serif" }}
    >
      {/* HEADER BAR */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 bg-white border border-[#e2e8f0] rounded-2xl shadow-xs">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-[#0f172a]">Chiến Lược & Lịch Trình Ôn Tập Quiz</h1>
          <p className="text-sm text-[#64748b]">Tối ưu hóa điểm số và khắc phục lỗ hổng kiến thức dựa trên dữ liệu local</p>
        </div>
        
        <div className="flex items-center gap-2">
          <label htmlFor="timetable-select" className="text-sm font-semibold text-[#475569] whitespace-nowrap">
            Chọn lịch trình:
          </label>
          <select
            id="timetable-select"
            value={selectedFilename}
            onChange={(e) => setSelectedFilename(e.target.value)}
            className="block w-full sm:w-72 px-3 py-2 bg-white border border-[#cbd5e1] rounded-xl text-sm focus:outline-hidden focus:border-[#00b4cc] focus:ring-2 focus:ring-[#00b4cc]/20 cursor-pointer transition-all"
          >
            <option value="">-- Chọn lịch trình ôn tập từ OPFS --</option>
            {fileList.map((filename) => (
              <option key={filename} value={filename}>
                {filename.replace(".json", "").toUpperCase()}
              </option>
            ))}
          </select>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-600 rounded-xl text-sm font-medium">
          ⚠️ {error}
        </div>
      )}

      {loading && (
        <div className="flex items-center justify-center p-12 text-[#64748b] text-sm font-medium">
          Đang nạp dữ liệu phân tích chiến lược từ bộ nhớ local...
        </div>
      )}

      {/* EMPTY STATE */}
      {!timetable && !loading && !error && (
        <div className="flex flex-col items-center justify-center border-2 border-dashed border-[#cbd5e1] rounded-2xl p-16 bg-white">
          <p className="text-[#334155] font-bold text-base">
            Chưa có kế hoạch gỡ điểm nào được chọn.
          </p>
          <p className="text-sm text-[#64748b] mt-1 text-center max-w-md">
            Vui lòng chọn một tệp cấu hình ôn tập ở dropdown góc trên bên phải để hiển thị tiến trình.
          </p>
          <div className="mt-6">
            <Link 
              href="/dashboard/assistant" 
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#FF3399] hover:bg-[#e11d48] text-white font-bold text-sm rounded-xl transition-all duration-200 shadow-xs active:scale-95 group"
            >
              <Sparkles className="w-4 h-4 group-hover:animate-spin" />
              <span>Phân tích & Tạo lịch ôn tập với Agent</span>
            </Link>
          </div>
        </div>
      )}

      {/* MAIN DASHBOARD PANEL */}
      {timetable && !loading && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* CỘT TRÁI: THÔNG TIN CHIẾN LƯỢC TỔNG QUAN */}
          <div className="lg:col-span-1 flex flex-col gap-6">
            {/* Tên mục tiêu học tập */}
            <div className="bg-white border border-[#e2e8f0] p-6 rounded-2xl">
              <div className="text-[11px] font-bold uppercase tracking-wider text-[#94a3b8] mb-1 flex items-center gap-1">
                <Target className="w-3.5 h-3.5 text-[#00b4cc]" /> Kế hoạch học tập
              </div>
              <h2 className="text-lg font-black text-[#0f172a] tracking-tight">{timetable.timetableName.replace(/_/g, ' ').toUpperCase()}</h2>
              <p className="text-xs font-semibold text-slate-500 mt-1">Mục tiêu bài: <span className="text-[#0f172a]">{timetable.quizTitle}</span></p>
              
              <div className="pt-3 border-t border-[#f1f5f9] text-xs text-[#64748b] mt-3">
                <p>📅 Ngày khởi tạo: <span className="font-semibold text-[#0f172a]">{formatDateTime(timetable.createdAt)}</span></p>
              </div>
            </div>

            {/* Các điểm cốt lõi cần tối ưu */}
            <div className="bg-white border border-[#e2e8f0] p-6 rounded-2xl">
              <div className="text-[11px] font-bold uppercase tracking-wider text-rose-500 mb-3 flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5" /> Chủ đề hổng cần tập trung
              </div>
              <div className="flex flex-wrap gap-1.5">
                {timetable.targetedWeakTopics.map((topic, index) => (
                  <span 
                    key={index} 
                    className="px-2.5 py-1 bg-rose-50 border border-rose-100 text-rose-700 text-xs font-bold rounded-lg"
                  >
                    🎯 {topic}
                  </span>
                ))}
              </div>
            </div>

            {/* Định hướng hành động chính */}
            <div className="bg-[#0f172a] text-white p-6 rounded-2xl flex-1">
              <div className="text-[11px] font-bold uppercase tracking-wider text-[#38bdf8] mb-2 flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5" /> Tóm tắt chiến lược cốt lõi
              </div>
              <p className="text-xs text-slate-300 leading-relaxed font-medium bg-slate-800/40 p-4 rounded-xl border border-slate-800">
                {timetable.overallStrategySummary}
              </p>
            </div>
          </div>

          {/* CỘT PHẢI: LỊCH TRÌNH CHI TIẾT THEO NGÀY */}
          <div className="lg:col-span-2 bg-white border border-[#e2e8f0] p-6 rounded-2xl">
            <div className="text-[11px] font-bold uppercase tracking-wider text-[#64748b] mb-4 flex items-center gap-1">
              <BookOpen className="w-3.5 h-3.5 text-[#00b4cc]" /> Lịch trình hành động chi tiết
            </div>
            
            <div className="space-y-4">
              {timetable.schedule.map((task, index) => (
                <div 
                  key={index} 
                  className="border border-[#e2e8f0] rounded-xl overflow-hidden bg-[#f8fafc] transition-all hover:border-[#00b4cc]"
                >
                  {/* Thanh Tiêu Đề Của Task */}
                  <div className="bg-white border-b border-[#e2e8f0] px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-1 text-xs bg-[#0f172a] text-white font-black rounded-md whitespace-nowrap">
                        {task.day}
                      </span>
                      <h3 className="text-sm font-bold text-[#0f172a]">
                        Trọng tâm: <span className="text-[#00b4cc]">{task.focusTopic}</span>
                      </h3>
                    </div>
                    <div className="flex items-center gap-3 text-xs">
                      <span className="flex items-center gap-1 font-bold text-[#475569] bg-slate-100 px-2 py-0.5 rounded-md">
                        <Clock className="w-3.5 h-3.5 text-[#64748b]" /> {task.durationMinutes} phút
                      </span>
                      <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 font-bold border border-emerald-100 rounded-md flex items-center gap-1 text-[11px]">
                        <Award className="w-3.5 h-3.5" /> {task.expectedImprovement}
                      </span>
                    </div>
                  </div>
                  
                  {/* Nội dung chi tiết các hành động */}
                  <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4 bg-white/50">
                    {/* Danh sách hành động */}
                    <div className="bg-white p-3.5 border border-[#e2e8f0] rounded-xl">
                      <span className="text-[10px] font-extrabold text-[#475569] uppercase tracking-wider block mb-2 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> Các đầu việc cụ thể
                      </span>
                      <ul className="text-xs text-[#334155] space-y-1.5 pl-1">
                        {task.actionItems.map((item, actIdx) => (
                          <li key={actIdx} className="flex gap-2 items-start">
                            <ArrowRight className="w-3 h-3 text-[#94a3b8] mt-1 flex-shrink-0" />
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Chiến lược sửa đổi điểm yếu */}
                    <div className="bg-amber-50/40 p-3.5 border border-amber-100 rounded-xl">
                      <span className="text-[10px] font-extrabold text-amber-700 uppercase tracking-wider block mb-2 flex items-center gap-1">
                        ⚠️ Phương pháp triệt tiêu lỗi sai
                      </span>
                      <ul className="text-xs text-amber-900 space-y-1.5 pl-1">
                        {task.weakTopicStrategies.map((strat, stratIdx) => (
                          <li key={stratIdx} className="flex gap-1.5 items-start">
                            <span className="text-amber-500 font-bold">•</span>
                            <span className="italic">{strat}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
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