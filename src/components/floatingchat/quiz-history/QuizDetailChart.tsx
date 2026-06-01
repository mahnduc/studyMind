import React, { useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { ChevronLeft, Calendar, BarChart2, Award, Clock, BrainCircuit } from 'lucide-react';
import AgentPage from './AgentPage'; 

// Import đúng interface từ file config của Agent
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

interface QuizDetailChartProps {
  quizTitle: string;
  chartData: ChartDataPoint[];
  onBack: () => void;
}

export const QuizDetailChart: React.FC<QuizDetailChartProps> = ({ quizTitle, chartData, onBack }) => {
  // State quản lý trạng thái hiển thị view Agent
  const [isAgentOpen, setIsAgentOpen] = useState(false);
  const [agentPayload, setAgentPayload] = useState<AgentStrategyRequest | null>(null);
  
  const handleCreateStrategy = () => {
    if (!chartData || chartData.length === 0) {
      alert("Không có dữ liệu lịch sử để phân tích.");
      return;
    }

    // Đóng gói dữ liệu đầu vào (Required + Mở rộng)
    const requestPayload: AgentStrategyRequest = {
      quizTitle,
      chartData,
      // Bạn có thể lấy thêm các trường optional này từ 1 form input/modal nếu có
      studentGoal: "Cải thiện độ chính xác và tối ưu tốc độ làm bài", 
      targetDate: "Chưa xác định",
      weakTopics: [],
      additionalNotes: ""
    };

    setAgentPayload(requestPayload);
    setIsAgentOpen(true); // Ẩn hoàn toàn biểu đồ để tối ưu không gian cho Agent
  };

  // === TRƯỜNG HỢP 1: ẨN BIỂU ĐỒ & HIỂN THỊ KHUNG CHAT AGENT FULL MÀN HÌNH ===
  if (isAgentOpen && agentPayload) {
    return (
      <div className="w-full h-full animate-in fade-in duration-200">
        <AgentPage 
          quizPayload={agentPayload} 
          onClose={() => {
            setIsAgentOpen(false);
            setAgentPayload(null);
          }}
        />
      </div>
    );
  }

  // === TRƯỜNG HỢP 2: GIAO DIỆN BIỂU ĐỒ GỐC VÀ LỊCH SỬ ===
  return (
    <div className="w-full h-full flex flex-col bg-white overflow-hidden animate-in fade-in duration-200">
      
      {/* Navigation Header */}
      <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-white sticky top-0 z-10">
        <div className="flex items-center gap-4">
          <button 
            onClick={onBack}
            className="p-2 hover:bg-slate-100 rounded-lg transition text-slate-600"
          >
            <ChevronLeft size={20} />
          </button>
          <div>
            <h2 className="text-lg font-bold text-slate-800">{quizTitle}</h2>
            <p className="text-xs text-slate-400">Tổng số lần làm bài: {chartData.length}</p>
          </div>
        </div>

        {/* Nút lập chiến lược */}
        <button
          onClick={handleCreateStrategy}
          className="flex items-center gap-2 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white text-xs font-medium rounded-lg shadow-sm transition-all duration-200"
        >
          <BrainCircuit size={14} />
          <span>Chiến lược ôn tập</span>
        </button>
      </div>

      <div className="flex-1 p-6 overflow-y-auto space-y-6">
        {/* Khung biểu đồ Recharts */}
        <div className="bg-slate-50/50 rounded-xl p-4 border border-slate-100">
          <h3 className="text-sm font-semibold text-slate-700 mb-4 flex items-center gap-2">
            <BarChart2 size={16} className="text-blue-500" /> Biểu đồ đường tăng trưởng chính xác (%)
          </h3>
          
          <div className="w-full h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 10, right: 30, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} tickLine={false} />
                <YAxis 
                  stroke="#94a3b8" 
                  fontSize={12} 
                  domain={[0, 100]} 
                  tickFormatter={(value) => `${value}%`}
                  tickLine={false}
                />
                <Tooltip 
                  content={({ active, payload }) => {
                    if (active && payload && payload.length > 0) {
                      const data = payload[0].payload as ChartDataPoint;
                      return (
                        <div className="bg-slate-800 text-white p-3 rounded-lg shadow-lg text-xs space-y-1 border border-slate-700">
                          <p className="font-bold border-b border-slate-700 pb-1 mb-1">{data.name}</p>
                          <p>Ngày: <span className="text-slate-300">{data.displayDate} lúc {data.displayTime}</span></p>
                          <p>Chính xác: <span className="text-emerald-400 font-bold">{data.accuracy}%</span></p>
                          <p>Điểm số: <span className="text-amber-400">{data.score}/{data.totalQuestions}</span></p>
                          <p>Thời gian: <span className="text-blue-400">{data.duration} giây</span></p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Line 
                  type="monotone" 
                  dataKey="accuracy" 
                  stroke="#2563eb" 
                  strokeWidth={3}
                  activeDot={{ r: 6 }}
                  dot={{ stroke: '#2563eb', strokeWidth: 2, r: 4, fill: '#fff' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Lịch sử làm bài chi tiết */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-slate-700">Lịch sử chi tiết (Từ mới đến cũ)</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {[...chartData].reverse().map((attempt) => (
              <div key={attempt.attemptId} className="p-4 border border-slate-100 rounded-xl bg-white shadow-sm flex items-center justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5 text-xs text-slate-400">
                    <Calendar size={12} />
                    <span>{attempt.displayDate} {attempt.displayTime}</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm pt-1">
                    <span className="flex items-center gap-1 font-medium text-slate-700">
                      <Award size={14} className="text-amber-500" /> {attempt.score}/{attempt.totalQuestions}
                    </span>
                    <span className="flex items-center gap-1 text-slate-500">
                      <Clock size={14} /> {attempt.duration}s
                    </span>
                  </div>
                </div>
                <div className={`text-base font-bold px-2.5 py-1 rounded-lg ${
                  attempt.accuracy >= 80 ? 'bg-emerald-50 text-emerald-600' :
                  attempt.accuracy >= 50 ? 'bg-amber-50 text-amber-600' : 'bg-rose-50 text-rose-600'
                }`}>
                  {attempt.accuracy}%
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};