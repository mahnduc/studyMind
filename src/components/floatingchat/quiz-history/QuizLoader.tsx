import React from 'react';

interface QuizLoaderProps {
  loading: boolean;
  error: string | null;
}

export const QuizLoader: React.FC<QuizLoaderProps> = ({ loading, error }) => {
  if (loading) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-slate-500 mt-4 text-sm">Đang quét dữ liệu OPFS...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-white p-6">
        <div className="text-center text-red-500 max-w-md">
          <p className="font-semibold">{error}</p>
          <p className="text-sm text-slate-400 mt-2">
            Vui lòng đảm bảo trình duyệt của bạn hỗ trợ File System Access API.
          </p>
        </div>
      </div>
    );
  }

  return null;
};