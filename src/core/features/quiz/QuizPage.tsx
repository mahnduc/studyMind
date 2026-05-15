"use client";
// ============================================================
// FILE: core/features/quiz/QuizPage.tsx
// MÔ TẢ: Trang quiz - danh sách các bộ câu hỏi + vào chơi
// ============================================================

import React, { useState } from "react";
import { useQuizList } from "./hooks/useQuiz";
import { QuizPlayer } from "./QuizPlayer";
import { formatRelativeTime } from "../../shared/utils";

export function QuizPage() {
  const { quizzes, isLoading, error, deleteQuiz } = useQuizList();
  const [activeQuizId, setActiveQuizId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  // Nếu đang chơi quiz, render QuizPlayer full
  if (activeQuizId) {
    return (
      <QuizPlayer
        quizId={activeQuizId}
        onBack={() => setActiveQuizId(null)}
      />
    );
  }

  return (
    <div className="flex flex-col h-full bg-[var(--surface)]">
      {/* Header */}
      <div className="px-4 py-3 border-b border-[var(--border)]">
        <p className="text-sm font-semibold text-[var(--text)]">Bộ câu hỏi của bạn</p>
        <p className="text-xs text-[var(--text-muted)]">
          {isLoading ? "Đang tải..." : `${quizzes.length} bộ câu hỏi`}
        </p>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4">
        {/* Error */}
        {error && (
          <div className="mb-3 px-3 py-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-xs text-red-600 dark:text-red-400">
            ⚠️ {error}
          </div>
        )}

        {/* Loading skeleton */}
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-24 bg-[var(--surface-alt)] rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : quizzes.length === 0 ? (
          /* Empty state */
          <div className="flex flex-col items-center justify-center py-16 text-center text-[var(--text-muted)] gap-3">
            <div className="text-5xl">📋</div>
            <p className="text-sm font-medium">Chưa có bộ câu hỏi nào</p>
            <p className="text-xs max-w-xs">
              Hỏi trợ lý tạo quiz từ tài liệu, hoặc dùng tính năng "Phiên học tập"
            </p>
            <div className="mt-2 px-4 py-2.5 bg-[var(--surface-alt)] border border-[var(--border)] rounded-xl text-xs text-[var(--text-muted)] text-left max-w-xs">
              <p className="font-medium mb-1">Gợi ý:</p>
              <p>💬 &nbsp;"Tạo 10 câu hỏi về chương 1"</p>
              <p>💬 &nbsp;"Học về machine learning"</p>
            </div>
          </div>
        ) : (
          /* Quiz list */
          <div className="space-y-2">
            {quizzes.map((quiz) => (
              <div
                key={quiz.id}
                className="group flex items-center gap-3 p-4 bg-[var(--surface)] border border-[var(--border)] rounded-2xl hover:border-[var(--accent)]/40 hover:shadow-sm transition-all cursor-pointer"
                onClick={() => setActiveQuizId(quiz.id)}
              >
                {/* Icon */}
                <div className="w-10 h-10 rounded-xl bg-[var(--accent)]/10 flex items-center justify-center text-xl shrink-0">
                  📋
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-[var(--text)] truncate">{quiz.title}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs text-[var(--text-muted)]">
                      {/* question_count không có trong Omit<Quiz, "questions">, dùng createdAt */}
                      {formatRelativeTime(quiz.createdAt)}
                    </span>
                  </div>
                </div>

                {/* Play button */}
                <div className="flex items-center gap-1.5 shrink-0">
                  {/* Delete */}
                  {confirmDeleteId === quiz.id ? (
                    <div
                      className="flex gap-1"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        onClick={() => setConfirmDeleteId(null)}
                        className="px-2 py-1 text-xs rounded-lg border border-[var(--border)] text-[var(--text-muted)] hover:bg-[var(--surface-alt)]"
                      >
                        Huỷ
                      </button>
                      <button
                        onClick={() => { deleteQuiz(quiz.id); setConfirmDeleteId(null); }}
                        className="px-2 py-1 text-xs rounded-lg bg-red-500 text-white hover:bg-red-600"
                      >
                        Xoá
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={(e) => { e.stopPropagation(); setConfirmDeleteId(quiz.id); }}
                      className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 opacity-0 group-hover:opacity-100 transition-all"
                    >
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="3 6 5 6 21 6" />
                        <path d="M19 6l-1 14H6L5 6" />
                        <path d="M10 11v6M14 11v6M9 6V4h6v2" />
                      </svg>
                    </button>
                  )}

                  <div className="w-8 h-8 rounded-xl bg-[var(--accent)] flex items-center justify-center text-white">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                      <polygon points="5 3 19 12 5 21 5 3" />
                    </svg>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}