'use client';

import React from 'react';
import { ArrowLeft, Trophy, Calendar } from 'lucide-react';
import { QuizCardData, QuizHistoryAttempt } from '@/types/quiz.type';

interface QuizHistoryDashboardProps {
  historyQuiz: QuizCardData;
  historyData: QuizHistoryAttempt[];
  loadingHistory: boolean;
  onBack: () => void;
  formatDate: (dateString: string) => string;
}

export default function QuizHistoryDashboard({
  historyQuiz,
  historyData,
  loadingHistory,
  onBack,
  formatDate,
}: QuizHistoryDashboardProps) {
  return (
    <div className="w-full flex flex-col gap-6 p-5 lg:p-8 bg-[#F7F9FB] min-h-screen animate-in fade-in duration-200 selection:bg-[#FF3399]/10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#E5E5E5] pb-5">
        <div className="flex flex-col gap-1">
          <button
            onClick={onBack}
            className="flex items-center gap-1.5 text-xs font-black text-[#B2BEC3] hover:text-[#2D3436] transition-colors uppercase tracking-wider bg-white px-3 py-1.5 rounded-xl border border-[#E5E5E5] w-fit cursor-pointer mb-2 shadow-xs"
          >
            <ArrowLeft size={14} strokeWidth={2.5} /> Quay lại thư viện
          </button>
        </div>
      </div>

      {loadingHistory ? (
        <div className="py-24 flex flex-col items-center justify-center gap-3 bg-white rounded-3xl border border-[#E5E5E5] shadow-xs">
          <div className="w-9 h-9 border-3 border-[#FF3399] border-t-transparent rounded-full animate-spin"></div>
          <p className="text-xs text-[#B2BEC3] font-black uppercase tracking-wider">Đang phân tích cấu trúc tệp lịch sử...</p>
        </div>
      ) : historyData.length === 0 ? (
        <div className="text-center py-24 bg-white rounded-3xl border border-[#E5E5E5] shadow-xs text-[#B2BEC3] text-sm font-semibold flex flex-col items-center justify-center gap-2">
          <div className="w-16 h-16 bg-[#F7F9FB] border border-[#E5E5E5] rounded-2xl flex items-center justify-center text-slate-300 mb-2">
            <Trophy size={32} />
          </div>
          <h4 className="text-base font-black text-[#2D3436] uppercase tracking-wide">Chưa có lịch sử kết quả</h4>
          <p className="text-xs text-[#B2BEC3] font-medium max-w-xs mx-auto">Vui lòng tham gia hoàn thành bộ trắc nghiệm này để tạo bảng phân tích số liệu.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white border border-[#E5E5E5] p-5 rounded-2xl shadow-2xs flex flex-col justify-between">
              <span className="text-[11px] font-black text-[#B2BEC3] uppercase tracking-wider">Tổng lượt thử</span>
              <div className="flex items-baseline gap-1 mt-2">
                <span className="text-2xl font-black text-[#2D3436]">{historyData.length}</span>
                <span className="text-xs text-[#B2BEC3] font-bold">lần</span>
              </div>
            </div>

            <div className="bg-white border border-[#E5E5E5] p-5 rounded-2xl shadow-2xs flex flex-col justify-between">
              <span className="text-[11px] font-black text-[#B2BEC3] uppercase tracking-wider">Kỷ lục điểm số</span>
              <div className="flex items-baseline gap-1 mt-2">
                <span className="text-2xl font-black text-[#FF3399]">
                  {Math.max(...historyData.map(h => h.score))}
                </span>
                <span className="text-xs text-[#B2BEC3] font-bold">/{historyQuiz.totalQuestions} câu</span>
              </div>
            </div>

            <div className="bg-white border border-[#E5E5E5] p-5 rounded-2xl shadow-2xs flex flex-col justify-between">
              <span className="text-[11px] font-black text-[#B2BEC3] uppercase tracking-wider">Chính xác trung bình</span>
              <div className="flex items-baseline gap-1 mt-2">
                <span className="text-2xl font-black text-emerald-500">
                  {Math.round(
                    historyData.reduce((acc, curr) => acc + (curr.accuracy || (curr.score / curr.totalQuestions) * 100), 0) / historyData.length
                  )}
                </span>
                <span className="text-xs text-emerald-500 font-bold">%</span>
              </div>
            </div>

            <div className="bg-white border border-[#E5E5E5] p-5 rounded-2xl shadow-2xs flex flex-col justify-between">
              <span className="text-[11px] font-black text-[#B2BEC3] uppercase tracking-wider">Thời gian tập trung TB</span>
              <div className="flex items-baseline gap-1 mt-2">
                <span className="text-2xl font-black text-blue-500">
                  {Math.round(historyData.reduce((acc, curr) => acc + (curr.duration || 0), 0) / historyData.length)}
                </span>
                <span className="text-xs text-[#B2BEC3] font-bold">giây/lượt</span>
              </div>
            </div>
          </div>

          <div className="bg-white border border-[#E5E5E5] rounded-2xl shadow-2xs overflow-hidden">
            <div className="px-6 py-4 border-b border-[#E5E5E5] flex items-center justify-between bg-slate-50/50">
              <h3 className="text-xs font-black text-[#2D3436] uppercase tracking-wider">
                Nhật ký tiến trình chi tiết
              </h3>
              <span className="text-[10px] bg-slate-200/60 text-slate-600 font-bold px-2 py-0.5 rounded-md">
                Sắp xếp: Mới nhất trước
              </span>
            </div>

            <div className="overflow-x-auto w-full">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-[#E5E5E5] text-[11px] font-black text-[#B2BEC3] uppercase tracking-wider bg-slate-50/30">
                    <th className="py-3 px-6 w-20">Lượt</th>
                    <th className="py-3 px-6">Thời gian hoàn thành</th>
                    <th className="py-3 px-6 text-center">Thời lượng</th>
                    <th className="py-3 px-6 text-center">Kết quả</th>
                    <th className="py-3 px-6 text-right w-40">Tỷ lệ chính xác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E5E5E5]">
                  {historyData.map((item, idx) => {
                    const currentAccuracy = item.accuracy !== undefined 
                      ? item.accuracy 
                      : Math.round((item.score / item.totalQuestions) * 100);

                    return (
                      <tr key={item.attemptId || idx} className="hover:bg-slate-50/60 transition-colors group">
                        <td className="py-4 px-6 text-xs font-black text-[#B2BEC3] group-hover:text-[#FF3399] transition-colors">
                          #{historyData.length - idx}
                        </td>
                        
                        <td className="py-4 px-6 text-sm font-semibold text-[#2D3436]">
                          <div className="flex items-center gap-1.5 text-xs text-[#636E72]">
                            <Calendar size={13} className="text-[#B2BEC3]" />
                            {formatDate(item.timestamp)}
                            <span className="text-[10px] text-[#B2BEC3] font-normal">
                              ({item.timestamp.split('T')[1]?.substring(0, 5) || ''})
                            </span>
                          </div>
                        </td>

                        <td className="py-4 px-6 text-xs font-bold text-[#636E72] text-center">
                          {item.duration ? `${item.duration} giây` : '---'}
                        </td>

                        <td className="py-4 px-6 text-center">
                          <span className="text-xs font-black text-[#2D3436] bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200/60">
                            <span className="text-[#FF3399]">{item.score}</span> / {item.totalQuestions}
                          </span>
                        </td>

                        <td className="py-4 px-6 text-right">
                          <div className="flex items-center justify-end gap-3">
                            <div className="w-16 bg-slate-100 rounded-full h-1.5 hidden sm:block overflow-hidden border border-slate-200/30">
                              <div 
                                className={`h-1.5 rounded-full ${
                                  currentAccuracy >= 80 ? 'bg-emerald-500' : currentAccuracy >= 50 ? 'bg-amber-500' : 'bg-rose-500'
                                }`}
                                style={{ width: `${currentAccuracy}%` }}
                              />
                            </div>
                            <span className={`text-xs font-black px-2 py-0.5 rounded-md border min-w-12 text-center ${
                              currentAccuracy >= 80 
                                ? 'bg-emerald-50 text-emerald-600 border-emerald-200/50' 
                                : currentAccuracy >= 50 
                                  ? 'bg-amber-50 text-amber-600 border-amber-200/50' 
                                  : 'bg-rose-50 text-rose-600 border-rose-200/50'
                            }`}>
                              {currentAccuracy}%
                            </span>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}