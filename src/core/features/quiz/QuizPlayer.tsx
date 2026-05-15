"use client";
// core/features/quiz/QuizPlayer.tsx
// MÔ TẢ: Component chơi quiz - hiển thị câu hỏi, nhận đáp án, review kết quả

import React from "react";
import { useQuizPlayer } from "./hooks/useQuiz";
import { Quiz, Question, QuizOption } from "../../quiz/types";
import { formatDateTime } from "../../shared/utils";

// ── Option button ─────────────────────────────────────────────

function OptionButton({
  option,
  selected,
  confirmed,
  isCorrect,
  correctId,
  onSelect,
}: {
  option: QuizOption;
  selected: boolean;
  confirmed: boolean;
  isCorrect: boolean;
  correctId: string;
  onSelect: (id: string) => void;
}) {
  const isThisCorrect = option.id === correctId;

  let style = "border-[var(--border)] bg-[var(--surface)] text-[var(--text)] hover:border-[var(--accent)]/50 hover:bg-[var(--surface-alt)]";
  if (confirmed) {
    if (isThisCorrect) {
      style = "border-green-400 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300";
    } else if (selected && !isCorrect) {
      style = "border-red-400 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300";
    } else {
      style = "border-[var(--border)] bg-[var(--surface)] text-[var(--text-muted)] opacity-60";
    }
  } else if (selected) {
    style = "border-[var(--accent)] bg-[var(--accent)]/5 text-[var(--text)]";
  }

  return (
    <button
      onClick={() => onSelect(option.id)}
      disabled={confirmed}
      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border text-sm text-left transition-all ${style} disabled:cursor-default`}
    >
      <span className={`w-6 h-6 rounded-full border flex items-center justify-center text-xs font-bold shrink-0 ${
        confirmed && isThisCorrect ? "border-green-400 bg-green-400 text-white" :
        confirmed && selected && !isCorrect ? "border-red-400 bg-red-400 text-white" :
        selected ? "border-[var(--accent)] bg-[var(--accent)] text-white" :
        "border-current"
      }`}>
        {option.id.toUpperCase()}
      </span>
      <span className="leading-snug">{option.text}</span>
      {confirmed && isThisCorrect && <span className="ml-auto">✓</span>}
      {confirmed && selected && !isCorrect && !isThisCorrect && <span className="ml-auto">✗</span>}
    </button>
  );
}

// ── Playing phase ─────────────────────────────────────────────

function PlayingView({
  question,
  questionIndex,
  totalQuestions,
  selectedAnswer,
  confirmed,
  isCorrect,
  isLastQuestion,
  onSelect,
  onConfirm,
  onNext,
}: {
  question: Question;
  questionIndex: number;
  totalQuestions: number;
  selectedAnswer: string | null;
  confirmed: boolean;
  isCorrect: boolean | null;
  isLastQuestion: boolean;
  onSelect: (id: string) => void;
  onConfirm: () => void;
  onNext: () => void;
}) {
  const progress = ((questionIndex + 1) / totalQuestions) * 100;

  return (
    <div className="flex flex-col h-full px-4 py-4 gap-4">
      {/* Progress */}
      <div className="space-y-1.5">
        <div className="flex justify-between text-xs text-[var(--text-muted)]">
          <span>Câu {questionIndex + 1} / {totalQuestions}</span>
          <span className={`font-medium px-2 py-0.5 rounded-full text-xs ${
            question.difficulty === "easy" ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300" :
            question.difficulty === "medium" ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300" :
            "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300"
          }`}>
            {question.difficulty === "easy" ? "Dễ" : question.difficulty === "medium" ? "TB" : "Khó"}
          </span>
        </div>
        <div className="h-1.5 bg-[var(--border)] rounded-full overflow-hidden">
          <div
            className="h-full bg-[var(--accent)] rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Question */}
      <div className="bg-[var(--surface-alt)] border border-[var(--border)] rounded-2xl p-4">
        <p className="text-sm font-medium text-[var(--text)] leading-relaxed">{question.content}</p>
      </div>

      {/* Options */}
      <div className="space-y-2 flex-1">
        {question.options.map((option) => (
          <OptionButton
            key={option.id}
            option={option}
            selected={selectedAnswer === option.id}
            confirmed={confirmed}
            isCorrect={isCorrect === true}
            correctId={question.correctId}
            onSelect={onSelect}
          />
        ))}
      </div>

      {/* Explanation */}
      {confirmed && question.explanation && (
        <div className={`px-4 py-3 rounded-xl text-xs leading-relaxed ${
          isCorrect
            ? "bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 border border-green-200 dark:border-green-800"
            : "bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800"
        }`}>
          <span className="font-medium">{isCorrect ? "✅ Chính xác! " : "💡 Giải thích: "}</span>
          {question.explanation}
        </div>
      )}

      {/* Action button */}
      <div>
        {!confirmed ? (
          <button
            onClick={onConfirm}
            disabled={!selectedAnswer}
            className="w-full py-3 rounded-2xl bg-[var(--accent)] text-white text-sm font-medium disabled:opacity-40 hover:opacity-90 transition-opacity"
          >
            Xác nhận đáp án
          </button>
        ) : (
          <button
            onClick={onNext}
            className="w-full py-3 rounded-2xl bg-[var(--accent)] text-white text-sm font-medium hover:opacity-90 transition-opacity"
          >
            {isLastQuestion ? "Xem kết quả" : "Câu tiếp theo →"}
          </button>
        )}
      </div>
    </div>
  );
}

// ── Review phase ──────────────────────────────────────────────

function ReviewView({
  quiz,
  answers,
  score,
  onFinish,
  onRestart,
}: {
  quiz: Quiz;
  answers: Record<string, string>;
  score: number;
  onFinish: () => Promise<void>;
  onRestart: () => void;
}) {
  const percent = Math.round((score / quiz.questions.length) * 100);
  const [saving, setSaving] = React.useState(false);

  const handleFinish = async () => {
    setSaving(true);
    await onFinish();
  };

  return (
    <div className="flex flex-col h-full px-4 py-4 gap-4">
      {/* Score card */}
      <div className="bg-[var(--surface-alt)] border border-[var(--border)] rounded-2xl p-5 text-center">
        <div className="text-4xl mb-2">
          {percent >= 80 ? "🏆" : percent >= 60 ? "👍" : "📚"}
        </div>
        <p className="text-2xl font-bold text-[var(--accent)]">{score}/{quiz.questions.length}</p>
        <p className="text-sm text-[var(--text-muted)]">{percent}% đúng</p>
        <p className="text-xs text-[var(--text-muted)] mt-1">
          {percent >= 80 ? "Xuất sắc!" : percent >= 60 ? "Khá tốt!" : "Hãy ôn tập thêm nhé!"}
        </p>
      </div>

      {/* Question review list */}
      <div className="flex-1 overflow-y-auto space-y-2">
        {quiz.questions.map((q, i) => {
          const userAnswer = answers[q.id];
          const correct = userAnswer === q.correctId;
          const selectedOption = q.options.find((o) => o.id === userAnswer);
          const correctOption = q.options.find((o) => o.id === q.correctId);

          return (
            <div
              key={q.id}
              className={`p-3 rounded-xl border text-xs space-y-1 ${
                correct
                  ? "border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/10"
                  : "border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/10"
              }`}
            >
              <div className="flex items-start gap-2">
                <span>{correct ? "✅" : "❌"}</span>
                <p className="text-[var(--text)] font-medium leading-snug">
                  {i + 1}. {q.content}
                </p>
              </div>
              {!correct && (
                <div className="pl-6 space-y-0.5">
                  <p className="text-red-600 dark:text-red-400">
                    Bạn chọn: {selectedOption?.text ?? "Không chọn"}
                  </p>
                  <p className="text-green-600 dark:text-green-400">
                    Đáp án đúng: {correctOption?.text}
                  </p>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        <button
          onClick={onRestart}
          className="flex-1 py-3 rounded-2xl border border-[var(--border)] text-sm text-[var(--text)] hover:bg-[var(--surface-alt)] transition-colors"
        >
          🔄 Làm lại
        </button>
        <button
          onClick={handleFinish}
          disabled={saving}
          className="flex-1 py-3 rounded-2xl bg-[var(--accent)] text-white text-sm font-medium hover:opacity-90 disabled:opacity-50 transition-opacity"
        >
          {saving ? "Đang lưu..." : "💾 Lưu kết quả"}
        </button>
      </div>
    </div>
  );
}

// ── Done phase ────────────────────────────────────────────────

function DoneView({
  score,
  total,
  attempts,
  onRestart,
}: {
  score: number;
  total: number;
  attempts: { id: string; score: number; total: number; finishedAt?: number }[];
  onRestart: () => void;
}) {
  return (
    <div className="flex flex-col h-full px-4 py-6 gap-4">
      <div className="text-center">
        <div className="text-5xl mb-3">🎉</div>
        <p className="text-base font-semibold text-[var(--text)]">Đã lưu kết quả!</p>
        <p className="text-sm text-[var(--text-muted)]">{score}/{total} câu đúng</p>
      </div>

      {attempts.length > 1 && (
        <div className="space-y-2">
          <p className="text-xs font-medium text-[var(--text-muted)]">Lịch sử làm bài</p>
          {attempts.slice(0, 5).map((a, i) => (
            <div key={a.id} className="flex items-center justify-between px-3 py-2 bg-[var(--surface-alt)] border border-[var(--border)] rounded-xl text-xs">
              <span className="text-[var(--text-muted)]">Lần {attempts.length - i}</span>
              <span className="font-medium text-[var(--text)]">{a.score}/{a.total}</span>
              <span className="text-[var(--text-muted)]">
                {a.finishedAt ? formatDateTime(a.finishedAt) : "—"}
              </span>
            </div>
          ))}
        </div>
      )}

      <button
        onClick={onRestart}
        className="mt-auto w-full py-3 rounded-2xl bg-[var(--accent)] text-white text-sm font-medium hover:opacity-90 transition-opacity"
      >
        🔄 Làm lại
      </button>
    </div>
  );
}

// ── QuizPlayer (main export) ──────────────────────────────────
// 'confirmed'
export function QuizPlayer({ quizId, onBack }: { quizId: string; onBack: () => void }) {
  const {
    quiz, phase, currentIndex, currentQuestion,
    selectedAnswer, answers, score,
    isLastQuestion, isCorrect, attempts, error,
    selectAnswer, confirmAnswer, nextQuestion, finish, restart,
  } = useQuizPlayer(quizId);

  // Patch: expose confirmed state via closure workaround
  const [localConfirmed, setLocalConfirmed] = React.useState(false);

  const handleConfirm = () => {
    confirmAnswer();
    setLocalConfirmed(true);
  };

  const handleNext = () => {
    nextQuestion();
    setLocalConfirmed(false);
  };

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-3 text-center px-4">
        <span className="text-3xl">⚠️</span>
        <p className="text-sm text-[var(--text)]">{error}</p>
        <button onClick={onBack} className="px-4 py-2 rounded-xl border border-[var(--border)] text-sm text-[var(--text-muted)]">
          Quay lại
        </button>
      </div>
    );
  }

  if (phase === "loading" || !quiz) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="w-6 h-6 border-2 border-[var(--accent)] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-[var(--surface)]">
      {/* Header */}
      <div className="px-4 py-3 border-b border-[var(--border)] flex items-center gap-2">
        <button
          onClick={onBack}
          className="p-1.5 rounded-lg text-[var(--text-muted)] hover:bg-[var(--surface-alt)] transition-colors"
        >
          ←
        </button>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-[var(--text)] truncate">{quiz.title}</p>
          <p className="text-xs text-[var(--text-muted)]">{quiz.questions.length} câu hỏi</p>
        </div>
      </div>

      {phase === "playing" && currentQuestion && (
        <PlayingView
          question={currentQuestion}
          questionIndex={currentIndex}
          totalQuestions={quiz.questions.length}
          selectedAnswer={selectedAnswer}
          confirmed={localConfirmed}
          isCorrect={isCorrect}
          isLastQuestion={isLastQuestion}
          onSelect={selectAnswer}
          onConfirm={handleConfirm}
          onNext={handleNext}
        />
      )}

      {phase === "review" && (
        <ReviewView
          quiz={quiz}
          answers={answers}
          score={score}
          onFinish={finish}
          onRestart={() => { restart(); setLocalConfirmed(false); }}
        />
      )}

      {phase === "done" && (
        <DoneView
          score={score}
          total={quiz.questions.length}
          attempts={attempts}
          onRestart={() => { restart(); setLocalConfirmed(false); }}
        />
      )}
    </div>
  );
}