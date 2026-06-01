import React from 'react';
import { Folder } from 'lucide-react';

interface QuizFileItem {
  fileName: string;
  displayName: string;
  fileHandle: FileSystemFileHandle;
}

interface QuizListProps {
  quizzes: QuizFileItem[];
  onSelectQuiz: (quiz: QuizFileItem) => void;
}

export const QuizList: React.FC<QuizListProps> = ({ quizzes, onSelectQuiz }) => {
  return (
    <div className="w-full h-full flex flex-col p-6 overflow-y-auto">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-slate-800">Lịch sử luyện tập Quiz</h2>
        <p className="text-sm text-slate-500 mt-1">Chọn một bộ câu hỏi dưới đây để xem biểu đồ phân tích tăng trưởng.</p>
      </div>

      {quizzes.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center border-2 border-dashed border-slate-200 rounded-2xl p-8 bg-white">
          <Folder size={48} className="text-slate-300 stroke-[1.5]" />
          <p className="text-slate-400 text-sm mt-3">Thư mục `history_quiz` hiện tại trống hoặc không có file dữ liệu .json hợp lệ.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {quizzes.map((quiz) => (
            <div
              key={quiz.fileName}
              onClick={() => onSelectQuiz(quiz)}
              className="group bg-white p-5 rounded-xl border border-slate-200/80 hover:border-blue-500/50 shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer flex items-start gap-4"
            >
              <div className="p-3 rounded-lg bg-blue-50 text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors duration-200">
                <Folder size={22} fill="currentColor" className="fill-transparent group-hover:fill-blue-200" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-slate-800 truncate group-hover:text-blue-600 transition-colors">
                  {quiz.displayName}
                </h3>
                <p className="text-xs text-slate-400 mt-1">Bấm để xem biểu đồ tiến trình</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};