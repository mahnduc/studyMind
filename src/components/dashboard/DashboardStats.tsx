'use client';

import React, { useState } from 'react';
import { TrendingUp, ChevronsUp, Info } from "lucide-react";
import { useProfileStore } from '@/stores/profileStore';
import Link from 'next/link';

// Cấu trúc XpLog mới từ Store của bạn
interface XpLog {
  timestamp: string;
  amount: number;
}

interface HeatmapDay {
  dateKey: string;
  dayIdx: number;
  // THAY ĐỔI: Chấp nhận cả số (bảo toàn cấu trúc cũ) hoặc mảng log chi tiết mới
  xp: number | XpLog[]; 
  dayOfMonth: number;
  formattedDate: string;
}

interface DashboardStatsProps {
  selectedMonth: number;
  selectedYear: number;
  setSelectedMonth: (month: number) => void;
  setSelectedYear: (year: number) => void;
  monthLabel: string;
  gridCells: (HeatmapDay | null)[];
  currentLevel: number;
  totalXp: number;
  xpInCurrentLevel: number;
  progressPercentage: number;
}

export default function DashboardStats({
  selectedMonth,
  selectedYear,
  setSelectedMonth,
  setSelectedYear,
  monthLabel,
  gridCells,
  currentLevel,
  totalXp,
  xpInCurrentLevel,
  progressPercentage
}: DashboardStatsProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-10 gap-4 items-stretch max-h-100 lg:h-112.5 lg:overflow-hidden w-full text-slate-800">
      <HeatmapSection 
        selectedMonth={selectedMonth}
        selectedYear={selectedYear}
        setSelectedMonth={setSelectedMonth}
        setSelectedYear={setSelectedYear}
        monthLabel={monthLabel}
        gridCells={gridCells}
      />

      <LevelSection 
        currentLevel={currentLevel}
        totalXp={totalXp}
        xpInCurrentLevel={xpInCurrentLevel}
        progressPercentage={progressPercentage}
      />
    </div>
  );
}

interface HeatmapSectionProps {
  selectedMonth: number;
  selectedYear: number;
  setSelectedMonth: (month: number) => void;
  setSelectedYear: (year: number) => void;
  monthLabel: string;
  gridCells: (HeatmapDay | null)[];
}

function HeatmapSection({
  selectedMonth,
  selectedYear,
  setSelectedMonth,
  setSelectedYear,
  monthLabel,
  gridCells
}: HeatmapSectionProps) {
  const daysOfWeekLabels = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];

  const monthsArray = Array.from({ length: 12 }, (_, i) => ({
    value: i,
    label: `Tháng ${i + 1}`
  }));

  const today = new Date();
  const yearsArray = Array.from(
    { length: 5 },
    (_, i) => today.getFullYear() - 2 + i
  );

  // HÀM TIỆN ÍCH: Tính toán tổng lượng XP từ log hoặc số thông thường
  const getDailyTotalXp = (xpData: number | XpLog[] | undefined): number => {
    if (xpData === undefined) return 0;
    if (typeof xpData === 'number') return xpData;
    if (Array.isArray(xpData)) {
      return xpData.reduce((sum, log) => sum + log.amount, 0);
    }
    return 0;
  };

  const getXpColorClass = (totalXp: number) => {
    if (totalXp <= 0) return 'bg-white border border-[#EBEBEB] text-[#2D3436]/70';
    if (totalXp < 30) return 'bg-[#00CEC9]/20 border border-[#00CEC9]/30 text-[#2D3436]';
    if (totalXp < 60) return 'bg-[#00CEC9]/40 border border-[#00CEC9]/50 text-[#2D3436]';
    if (totalXp < 100) return 'bg-[#00CEC9]/70 border border-[#00CEC9]/80 text-white';
    return 'bg-[#00CEC9] border border-[#00A8A5] shadow-[0_0_8px_rgba(0,206,201,0.2)] text-white';
  };

  return (
    <div className="lg:col-span-7 bg-white border-2 border-[#2D3436]/5 rounded-[24px] p-5 flex flex-col gap-4 h-full w-full overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#2D3436]/5 pb-3 shrink-0">
        <div className="flex items-center gap-2.5">
            <div className="p-2 bg-[#00CEC9]/10 rounded-xl text-[#00CEC9] shrink-0">
              <TrendingUp size={18} />
            </div>
            <div>
              <h3 className="text-sm font-black text-[#2D3436] tracking-tight leading-none">
                  Tần Suất Học Tập
              </h3>
              <p className="text-xs text-[#2D3436]/60 mt-1">
                  Tiến độ chi tiết theo tháng
              </p>
            </div>
        </div>
        <div className="flex items-center gap-1.5 bg-[#F7F9F8] p-1 rounded-lg border border-[#2D3436]/5 self-start sm:self-auto shrink-0">
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(Number(e.target.value))}
              className="bg-white text-xs font-bold text-[#2D3436] px-2.5 py-1 rounded-md border border-[#2D3436]/5 outline-none cursor-pointer focus:border-[#00CEC9]"
            >
              {monthsArray.map((m) => (
                  <option key={m.value} value={m.value}>
                    {m.label}
                  </option>
              ))}
            </select>

            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="bg-white text-xs font-bold text-[#2D3436] px-2.5 py-1 rounded-md border border-[#2D3436]/5 outline-none cursor-pointer focus:border-[#00CEC9]"
            >
              {yearsArray.map((y) => (
                  <option key={y} value={y}>
                    Năm {y}
                  </option>
              ))}
            </select>
        </div>
        </div>

        <div className="w-full bg-[#F7F9F8]/60 border border-[#2D3436]/5 p-4 rounded-xl flex flex-col gap-3 flex-1 overflow-hidden">
        
        <div className="flex items-center justify-between shrink-0">
            <span className="text-xs font-extrabold text-[#2D3436]/80 px-2.5 py-1 bg-white border border-[#2D3436]/5 rounded-md shadow-sm w-fit">
              {monthLabel}
            </span>

            <div className="flex items-center gap-1.5 text-xs font-bold text-[#2D3436]/50">
              <div className="w-3 h-3 rounded-sm bg-white border border-[#EBEBEB]" />
              <div className="w-3 h-3 rounded-sm bg-[#00CEC9]/20 border border-[#00CEC9]/30" />
              <div className="w-3 h-3 rounded-sm bg-[#00CEC9]/40 border border-[#00CEC9]/50" />
              <div className="w-3 h-3 rounded-sm bg-[#00CEC9]/70 border border-[#00CEC9]/80" />
              <div className="w-3 h-3 rounded-sm bg-[#00CEC9]" />
            </div>
        </div>

        <div className="w-full flex-1 flex flex-col min-h-0">
            
            <div className="grid grid-cols-7 gap-1.5 text-center mb-2 shrink-0">
            {daysOfWeekLabels.map((label, idx) => (
                <span
                  key={idx}
                  className={`text-xs font-black uppercase tracking-wider ${
                      idx === 0 ? 'text-[#FF4D4F]' : 'text-[#2D3436]/40'
                  }`}
                >
                  {label}
                </span>
            ))}
            </div>

            <div className="grid grid-cols-7 gap-1.5 flex-1 items-stretch content-stretch auto-rows-fr">
            {gridCells.map((dayItem, cellIdx) => {
                if (!dayItem) {
                  return (
                      <div
                        key={`empty-${cellIdx}`}
                        className="w-full h-full bg-transparent pointer-events-none"
                      />
                  );
                }

                // Tính tổng điểm trong ngày để phân cấp màu và hiển thị tooltip
                const totalXpInDay = getDailyTotalXp(dayItem.xp);
                // Đếm số lần cộng XP trong ngày
                const clickCount = Array.isArray(dayItem.xp) ? dayItem.xp.length : (dayItem.xp > 0 ? 1 : 0);

                return (
                  <div
                      key={dayItem.dateKey}
                      className={`w-full h-full rounded-lg transition-all duration-150 hover:scale-[1.03] cursor-pointer hover:shadow-md flex items-center justify-center text-xs sm:text-sm font-bold select-none ${getXpColorClass(totalXpInDay)}`}
                      title={`${dayItem.formattedDate}: Tích lũy ${totalXpInDay} XP${clickCount > 0 ? ` (${clickCount} lần cộng)` : ''}`}
                  >
                      {dayItem.dayOfMonth}
                  </div>
                );
            })}
            </div>
        </div>
        </div>
    </div>
    );
}

interface LevelSectionProps {
  currentLevel: number;
  totalXp: number;
  xpInCurrentLevel: number;
  progressPercentage: number;
}

function LevelSection({
  currentLevel,
  totalXp,
  xpInCurrentLevel,
  progressPercentage,
}: LevelSectionProps) {
  const [isUpgrading, setIsUpgrading] = useState(false);
  const addXp = useProfileStore((state) => state.addXp);

  // Cấu hình cho vòng tròn SVG
  const radius = 40;
  const strokeDasharray = 2 * Math.PI * radius;
  const strokeDashoffset = strokeDasharray - (progressPercentage / 100) * strokeDasharray;

  const handleCheckIn = async () => {
    if (isUpgrading) return;
    setIsUpgrading(true);
    
    try {
      // Gọi hàm của Store mới, tự động lưu log thời gian thực
      await addXp(10); 
    } catch (error) {
      console.error("Lỗi tăng XP:", error);
    } finally {
      setIsUpgrading(false);
    }
  };

  return (
    <div className="lg:col-span-3 bg-[#2D3436] text-white rounded-[24px] p-5 flex flex-col justify-between shadow-lg relative overflow-hidden group min-h-[320px] lg:min-h-0 h-full w-full">
      <div className="absolute -top-12 -right-12 w-48 h-48 bg-[#00CEC9]/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="flex justify-between items-start z-10 shrink-0">
        <div className="flex flex-col gap-0.5">
          <span className="text-[9px] font-black tracking-widest text-[#00CEC9] uppercase bg-[#00CEC9]/10 px-2 py-0.5 rounded-md w-fit">
            Cấp độ hiện tại
          </span>
        </div>
      </div>

      {/* Vòng Tròn Tiến Độ Trung Tâm */}
      <div className="flex-1 flex flex-col items-center justify-center my-4 z-10 relative">
        <div className="relative w-28 h-28 flex items-center justify-center">
          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
            <circle
              cx="50"
              cy="50"
              r={radius}
              className="stroke-white/10"
              strokeWidth="6"
              fill="transparent"
            />
            <circle
              cx="50"
              cy="50"
              r={radius}
              className="stroke-[#00CEC9] transition-all duration-700 ease-out"
              strokeWidth="6"
              fill="transparent"
              strokeDasharray={strokeDasharray}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
            />
          </svg>

          <div className="absolute flex flex-col items-center justify-center text-center">
            <span className="text-2xl font-[900] tracking-tighter text-white leading-none">
              LV.{currentLevel}
            </span>
            <span className="text-[10px] text-[#00CEC9] font-bold mt-0.5">
              {progressPercentage}%
            </span>
          </div>
        </div>

        <div className="text-center mt-3">
          <div className="text-xs font-bold text-[#F7F9F8]">
            {xpInCurrentLevel} <span className="text-[#F7F9F8]/40">/ 100 XP</span>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-3 z-10 shrink-0 border-t border-white/10 pt-3">
        {/* <button
          onClick={handleCheckIn}
          disabled={isUpgrading}
          className={`w-full py-2.5 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all duration-200 select-none active:scale-[0.98] bg-[#00CEC9] text-[#2D3436] hover:bg-[#00b8b5] hover:shadow-[0_0_12px_rgba(0,206,201,0.3)] disabled:opacity-50`}
        >
          <ChevronsUp className={isUpgrading ? "animate-bounce" : ""} size={16} /> 
          {isUpgrading ? "Đang xử lý..." : "Nhấn để up cấp"}
        </button> */}

        {/* Footer */}
        <div className="flex items-center justify-between text-[10px]">
          <div className="flex items-center gap-1 font-bold text-[#00CEC9]">
            <Link href="">
              <Info size={12} />
            </Link>
          </div>
          <span className="font-bold text-[#00CEC9]">
            Còn {100 - xpInCurrentLevel} XP lên cấp
          </span>
        </div>
      </div>
    </div>
  );
}