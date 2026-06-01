'use client';

import React, { useState, useEffect } from 'react';
import DashboardUtil from '../../components/dashboard/DashboardUtil';
import DashboardStats from '../../components/dashboard/DashboardStats'; 
import { useProfileStore } from "@/stores/profileStore";

interface HeatmapDay {
  dateKey: string;
  dayIdx: number;
  xp: number;
  dayOfMonth: number;
  formattedDate: string;
}

export default function HomePage() {
  const profile = useProfileStore((state) => state.profile);
  const loadProfile = useProfileStore((state) => state.loadProfile);
  const [mounted, setMounted] = useState(false);

  const today = new Date();
  const [selectedMonth, setSelectedMonth] = useState<number>(today.getMonth());
  const [selectedYear, setSelectedYear] = useState<number>(today.getFullYear());

  useEffect(() => {
    setMounted(true);
    loadProfile();
  }, [loadProfile]);

  // --- LOGIC TÍNH TOÁN LEVEL VÀ TIẾN TRÌNH EXP ---
  const totalXp = profile?.totalXp || 0;
  const currentLevel = Math.floor(totalXp / 100) + 1;
  const xpInCurrentLevel = totalXp % 100;
  const progressPercentage = xpInCurrentLevel;

  // --- LOGIC SINH DỮ LIỆU HEATMAP ---
  const getCleanHeatmapData = (month: number, year: number) => {
    const dailyXpData = profile?.dailyXp || {};
    const monthLabel = `Tháng ${month + 1} - Năm ${year}`;

    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDayOfMonth = new Date(year, month, 1);

    const startPaddingCount = firstDayOfMonth.getDay();
    const gridCells: (HeatmapDay | null)[] = [];

    // Padding đầu tháng
    for (let i = 0; i < startPaddingCount; i++) {
      gridCells.push(null);
    }

    // Dữ liệu ngày
  for (let d = 1; d <= daysInMonth; d++) {
    const currentDate = new Date(year, month, d);
    const dayIdx = currentDate.getDay();
    const dateKey = currentDate.toLocaleDateString('sv-SE');

    const dayLogs = dailyXpData[dateKey] || [];
    
    const xpAmount = Array.isArray(dayLogs) 
      ? dayLogs.reduce((sum, log) => sum + (log.amount || 0), 0) 
      : 0;

    gridCells.push({
      dateKey,
      dayIdx,
      xp: xpAmount, // Bây giờ xpAmount chắc chắn là một biến kiểu 'number'
      dayOfMonth: d,
      formattedDate: currentDate.toLocaleDateString('vi-VN', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      })
    });
  }

    // Padding cuối tháng
    while (gridCells.length % 7 !== 0) {
      gridCells.push(null);
    }

    return { monthLabel, gridCells };
  };

  const { monthLabel, gridCells } = getCleanHeatmapData(selectedMonth, selectedYear);

  if (!mounted) {
    return <div className="min-h-screen bg-[#F7F9F8]" />;
  }
  
  return (
    <div className="w-full flex flex-col gap-6 p-4 lg:p-6 max-w-[1400px] mx-auto min-h-screen bg-[#F7F9F8] text-[#2D3436]">
      
      {/* Component chứa UI Heatmap & Level vừa được tách biệt */}
      <DashboardStats 
        selectedMonth={selectedMonth}
        selectedYear={selectedYear}
        setSelectedMonth={setSelectedMonth}
        setSelectedYear={setSelectedYear}
        monthLabel={monthLabel}
        gridCells={gridCells}
        currentLevel={currentLevel}
        totalXp={totalXp}
        xpInCurrentLevel={xpInCurrentLevel}
        progressPercentage={progressPercentage}
      />

      {/* DASHBOARD UTIL */}
      <DashboardUtil />

    </div>
  );
}