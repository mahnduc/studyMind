import React, { useEffect, useState } from 'react';
import { QuizLoader } from './quiz-history/QuizLoader';
import { QuizDetailChart } from './quiz-history/QuizDetailChart';
import { QuizList } from './quiz-history/QuizList';

interface QuizFileItem {
  fileName: string;
  displayName: string;
  fileHandle: FileSystemFileHandle;
}

interface QuizAttempt {
  attemptId: string | number;
  timestamp: string | number;
  accuracy: number;
  score: number;
  totalQuestions: number;
  duration: number;
}

interface ChartDataPoint extends QuizAttempt {
  name: string;
  displayDate: string;
  displayTime: string;
}

interface QuizJsonData {
  quizFileName: string;
  attempts: QuizAttempt[];
}

export default function ContentWindow() {
  const [quizzes, setQuizzes] = useState<QuizFileItem[]>([]);
  const [selectedQuiz, setSelectedQuiz] = useState<QuizJsonData | null>(null);
  const [chartData, setChartData] = useState<ChartDataPoint[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Quét thư mục history_quiz từ OPFS
  useEffect(() => {
    async function scanOPFSHistory() {
      try {
        setLoading(true);
        const root = await navigator.storage.getDirectory();
        const historyDir = await root.getDirectoryHandle('history_quiz', { create: true });
        const quizList: QuizFileItem[] = [];
        
        for await (const [name, handle] of (historyDir as any).entries()) {
          if (handle.kind === 'file' && name.endsWith('.json')) {
            quizList.push({
              fileName: name,
              displayName: name.replace('.json', ''),
              fileHandle: handle as FileSystemFileHandle
            });
          }
        }
        setQuizzes(quizList);
      } catch (err) {
        console.error("Lỗi khi đọc OPFS:", err);
        setError("Không thể truy cập dữ liệu lịch sử từ OPFS.");
      } finally {
        setLoading(false);
      }
    }
    scanOPFSHistory();
  }, []);

  // Xử lý đọc tệp JSON & convert data
  const handleSelectQuiz = async (quiz: QuizFileItem) => {
    try {
      const file = await quiz.fileHandle.getFile();
      const text = await file.text();
      const data: QuizJsonData = JSON.parse(text);
      
      if (data.attempts && Array.isArray(data.attempts)) {
        const sortedAttempts: ChartDataPoint[] = [...data.attempts]
          .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
          .map((attempt, index) => {
            const date = new Date(attempt.timestamp);
            return {
              ...attempt,
              name: `Lần ${index + 1}`,
              displayDate: date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' }),
              displayTime: date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
            };
          });
          
        setSelectedQuiz(data);
        setChartData(sortedAttempts);
      } else {
        alert("File dữ liệu không đúng định dạng lịch sử.");
      }
    } catch (err) {
      console.error("Lỗi khi đọc chi tiết file:", err);
      alert("Không thể đọc file dữ liệu này.");
    }
  };

  // 1. Kiểm tra trạng thái Loading / Error trước
  if (loading || error) {
    return <QuizLoader loading={loading} error={error} />;
  }

  // 2. Render UI tương ứng dựa vào State điều hướng
  return (
    <div className="w-full h-full flex flex-col bg-slate-50">
      {selectedQuiz ? (
        <QuizDetailChart
          quizTitle={selectedQuiz.quizFileName.replace('.json', '')}
          chartData={chartData}
          onBack={() => setSelectedQuiz(null)}
        />
      ) : (
        <QuizList
          quizzes={quizzes}
          onSelectQuiz={handleSelectQuiz}
        />
      )}
    </div>
  );
}