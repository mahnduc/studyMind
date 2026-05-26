"use client";

import React, { useState, useEffect } from "react";
import { generateMCQBankFromOPFS, MCQQuestion } from "@/lib/rag/qa-generator";
import { Settings, FileText, CheckCircle2 } from "lucide-react";
import { getAllKnowledgeBases } from "@/lib/rag/api";

// Sửa đổi hàm helper: Đảm bảo chỉ truy cập đúng thư mục tri thức nguồn và tạo duy nhất 1 file trắc nghiệm tại đó
async function writeSingleJsonToOPFS(knowledgeBaseName: string, fileName: string, data: any): Promise<void> {
  const root = await navigator.storage.getDirectory();
  // Lấy chính xác handle của thư mục tri thức hiện tại (không tạo thêm các tầng thư mục lặp)
  const dirHandle = await root.getDirectoryHandle(knowledgeBaseName, { create: false });
  const fileHandle = await dirHandle.getFileHandle(fileName, { create: true });
  const writable = await fileHandle.createWritable();
  await writable.write(JSON.stringify(data, null, 2));
  await writable.close();
}

export default function QuizGeneratorPage() {
  const [knowledgeBases, setKnowledgeBases] = useState<string[]>([]);
  const [selectedKB, setSelectedKB] = useState<string>("");
  const [maxQuestions, setMaxQuestions] = useState<number>(10);
  const [loading, setLoading] = useState<boolean>(false);
  const [statusText, setStatusText] = useState<string>("");
  const [mcqList, setMcqList] = useState<MCQQuestion[]>([]);
  const [savedPath, setSavedPath] = useState<string>("");

  useEffect(() => {
    let isMounted = true;

    async function fetchKBs() {
      try {
        const kbs = await getAllKnowledgeBases();
        if (!isMounted) return;

        setKnowledgeBases(kbs);
        if (kbs.length > 0) {
          setSelectedKB(kbs[0]);
        }
      } catch (err) {
        console.error("Không thể lấy danh sách bộ tri thức từ OPFS:", err);
        if (isMounted) {
          setStatusText("Lỗi cấu trúc thư mục OPFS.");
        }
      }
    }
    
    fetchKBs();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleGenerateQuiz = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedKB || loading) return;

    setLoading(true);
    setMcqList([]);
    setSavedPath("");
    setStatusText("Đang phân tích cấu trúc văn bản qua Groq API...");

    try {
      const questions = await generateMCQBankFromOPFS(selectedKB, maxQuestions);
      
      if (questions.length === 0) {
        throw new Error("Không sinh được câu hỏi. Vui lòng kiểm tra lại tệp dữ liệu.");
      }

      setMcqList(questions);
      setStatusText(`Đã tạo thành công ${questions.length} câu hỏi.`);

      // Gom toàn bộ thông tin tri thức vào 1 Object duy nhất
      const quizData = {
        knowledgeBase: selectedKB,
        createdAt: new Date().toISOString(),
        totalQuestions: questions.length,
        questions: questions
      };

      // Đặt tên file cố định để ghi đè (Overwrite) nếu tạo lại, tránh tạo ra file rác
      const fileName = `${selectedKB}_quiz.json`;
      
      // Gọi hàm ghi tệp duy nhất vào đúng thư mục tri thức
      await writeSingleJsonToOPFS(selectedKB, fileName, quizData);
      
      setSavedPath(`/${selectedKB}/${fileName}`);
      setStatusText(`Đã đồng bộ trắc nghiệm thành công.`);
    } catch (error: any) {
      console.error(error);
      setStatusText(`Thất bại: ${error?.message || error}`);
    } finally {
      setLoading(false);
    }
  };

  return (
  <div className="flex flex-col w-full h-screen overflow-hidden bg-white text-[#2D3436]">
    {/* Header */}
    <div className="flex-none px-6 py-3 border-b border-[#F0F0F0] flex items-center justify-between bg-[#F7F9FB]/50">
      <div>
        <h2 className="text-sm font-black text-[#2D3436] tracking-tight">
          AI QUIZ GENERATOR
        </h2>
        <p className="text-[11px] text-[#727E82] font-semibold mt-0.5">
          Tự động biên soạn câu hỏi trắc nghiệm từ kho lưu trữ Local RAG
        </p>
      </div>
      <div className="text-[11px] font-bold text-[#FF3399] bg-[#FFF0F7] px-2.5 py-1 rounded-lg border border-[#FF3399]/20">
        Local-First Engine
      </div>
    </div>

    {/* Body: chiếm toàn bộ phần còn lại */}
    <div className="flex flex-1 overflow-hidden min-h-0">

      {/* PANEL TRÁI: điều khiển — chiều rộng cố định, không cuộn ngoài */}
      <aside className="w-64 flex-none flex flex-col border-r border-[#F0F0F0] bg-[#F7F9FB]/40 overflow-y-auto">
        <div className="flex-1 px-5 py-5 space-y-5">
          <h3 className="text-[10px] font-black text-[#FF3399] uppercase tracking-wider flex items-center gap-1.5">
            <Settings size={12} strokeWidth={3} /> Cấu hình thông số
          </h3>

          <form onSubmit={handleGenerateQuiz} className="space-y-4">
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-extrabold text-[#727E82] uppercase tracking-wide">
                Bộ tri thức nguồn
              </label>
              <div className="relative">
                <select
                  value={selectedKB}
                  onChange={(e) => setSelectedKB(e.target.value)}
                  disabled={loading}
                  className="w-full bg-white border border-[#E5E5E5] rounded-lg px-3 py-2 text-xs text-[#2D3436] font-bold appearance-none focus:outline-none focus:border-[#FF3399] disabled:opacity-50 transition-colors cursor-pointer"
                >
                  {knowledgeBases.length === 0 ? (
                    <option value="">(Không tìm thấy dữ liệu)</option>
                  ) : (
                    knowledgeBases.map((kb) => (
                      <option key={kb} value={kb}>{kb}</option>
                    ))
                  )}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-[#B2BEC3] text-[10px]">▼</div>
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-extrabold text-[#727E82] uppercase tracking-wide">
                Số lượng câu hỏi
              </label>
              <input
                type="number"
                min="1"
                max="20"
                value={maxQuestions}
                onChange={(e) => setMaxQuestions(Number(e.target.value))}
                disabled={loading}
                className="text-center w-full bg-white border border-[#E5E5E5] rounded-lg px-3 py-2 text-xs font-black text-[#2D3436] focus:outline-none focus:border-[#FF3399] disabled:opacity-50 transition-colors"
              />
            </div>

            <button
              type="submit"
              disabled={loading || !selectedKB}
              className="w-full bg-[#FF3399] text-white font-black text-xs h-9 rounded-lg border-b-[3px] border-[#D12A7E] active:border-b-0 active:translate-y-[3px] transition-all disabled:bg-[#EBF0F2] disabled:text-[#B2BEC3] disabled:border-b-0 disabled:translate-y-0 disabled:cursor-not-allowed uppercase tracking-wide"
            >
              {loading ? "Đang xử lý..." : "Sinh bộ câu hỏi"}
            </button>
          </form>
        </div>

        {/* Log status — ghim ở đáy panel trái */}
        {statusText && (
          <div className="flex-none px-5 py-4 border-t border-[#F0F0F0]">
            <div className="bg-[#2D3436] text-white rounded-lg px-3 py-2.5 text-[11px] font-mono break-words leading-relaxed flex items-start gap-2">
              {loading && (
                <span className="inline-block w-2 h-2 rounded-full bg-[#00CEC9] animate-ping shrink-0 mt-0.5" />
              )}
              <span className="text-[#F7F9FB]">{statusText}</span>
            </div>
          </div>
        )}
      </aside>

      {/* PANEL PHẢI: chiếm toàn bộ không gian còn lại */}
      <main className="flex-1 flex flex-col overflow-hidden min-w-0">

        {/* Banner lưu file — chỉ hiện khi có savedPath */}
        {savedPath && (
          <div className="flex-none bg-[#FFF0F7] border-b border-[#FF3399]/10 px-5 py-2 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 min-w-0">
              <CheckCircle2 size={13} className="text-[#FF3399] shrink-0" />
              <span className="text-[11px] text-[#FF3399] font-bold truncate">
                Đã lưu: <span className="font-mono font-medium text-[#2D3436]">{savedPath}</span>
              </span>
            </div>
            <span className="text-[10px] uppercase font-black tracking-wider text-white bg-[#00CEC9] px-2 py-0.5 rounded-md shrink-0">
              OPFS Sync
            </span>
          </div>
        )}

        {/* Vùng cuộn chính — chiếm toàn bộ chiều cao còn lại */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">

          {/* Empty state */}
          {mcqList.length === 0 && !loading && (
            <div className="flex flex-col items-center justify-center text-center h-full py-16 opacity-70">
              <div className="w-10 h-10 bg-[#F7F9FB] rounded-xl flex items-center justify-center text-[#B2BEC3] mb-3 border border-[#E5E5E5]">
                <FileText size={18} />
              </div>
              <h4 className="text-sm font-bold text-[#2D3436]">Chưa có câu hỏi trắc nghiệm</h4>
              <p className="text-xs text-[#727E82] mt-1 font-semibold leading-relaxed max-w-xs">
                Vui lòng chọn cấu hình bộ tri thức bên trái để AI bóc tách đề thi.
              </p>
            </div>
          )}

          {/* Loading state */}
          {loading && mcqList.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full py-16">
              <div className="w-7 h-7 border-2 border-[#FF3399] border-t-transparent rounded-full animate-spin mb-3" />
              <h4 className="text-xs font-bold text-[#2D3436]">Đang khởi tạo cấu trúc kiểm tra...</h4>
            </div>
          )}

          {/* Danh sách câu hỏi */}
          {mcqList.map((item, index) => (
            <div
              key={item.chunkId + "-" + index}
              className="bg-white border border-[#E5E5E5] rounded-xl p-4 hover:border-[#FF3399]/30 transition-all"
            >
              <div className="flex items-center justify-between gap-3 mb-3">
                <span className="bg-[#FF3399] text-white text-[10px] font-black px-2 py-0.5 rounded-md shadow-[0_2px_0_0_#D12A7E]">
                  CÂU {index + 1}
                </span>
                <span className="text-[10px] font-mono font-bold text-[#B2BEC3] truncate max-w-[220px]">
                  ID: {item.chunkId}
                </span>
              </div>

              <p className="text-sm font-extrabold text-[#2D3436] leading-relaxed mb-3">
                {item.question}
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {Object.entries(item.options).map(([key, value]) => {
                  const isCorrect = item.answer === key;
                  return (
                    <div
                      key={key}
                      className={`p-2.5 rounded-lg border flex items-start gap-2.5 transition-all ${
                        isCorrect
                          ? "bg-[#FFF0F7] border-[#FF3399]/40 text-[#FF3399]"
                          : "bg-[#F7F9FB] border-[#E5E5E5] text-[#2D3436] hover:bg-[#F0F2F5]"
                      }`}
                    >
                      <span className={`font-mono font-black px-1.5 py-0.5 text-[10px] rounded shrink-0 ${
                        isCorrect ? "bg-[#FF3399] text-white" : "bg-white border border-[#E5E5E5] text-[#727E82]"
                      }`}>
                        {key}
                      </span>
                      <span className="text-xs font-bold leading-normal pt-0.5">{value}</span>
                    </div>
                  );
                })}
              </div>

              <div className="mt-3 flex justify-end">
                <div className="text-[11px] font-black text-white bg-[#00CEC9] border-b-[3px] border-[#00A8A3] px-3 py-1 rounded-lg flex items-center gap-1.5">
                  Đáp án đúng: <span className="font-mono">{item.answer}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  </div>
);
}