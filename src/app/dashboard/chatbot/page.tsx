"use client";

import React, { useState } from "react";
import { useHybridSearch } from "./_hooks/useHybridSearch";
import KnowledgeSidebar from "./_components/KnowledgeSidebar";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Search, Send, Brain, Compass, Sparkles, BookOpen, Database, Flame, Zap } from "lucide-react";

// ─── Markdown Renderer Component ────────────────────────────────────────────
function MarkdownContent({ content }: { content: string }) {
  return (
    <div className="prose prose-sm max-w-none font-sans" style={{ fontFamily: "'Nunito', sans-serif" }}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: ({ children }) => (
            <h1 className="text-[18px] font-extrabold text-[#2D3436] mt-4 mb-2 leading-snug">
              {children}
            </h1>
          ),
          h2: ({ children }) => (
            <h2 className="text-[15px] font-bold text-[#2D3436] mt-3 mb-1.5 leading-snug">
              {children}
            </h2>
          ),
          h3: ({ children }) => (
            <h3 className="text-[13px] font-bold text-[#2D3436] mt-2.5 mb-1 uppercase tracking-wide">
              {children}
            </h3>
          ),
          p: ({ children }) => (
            <p className="text-[14px] text-[#2D3436] font-normal leading-relaxed mb-2 last:mb-0">
              {children}
            </p>
          ),
          strong: ({ children }) => (
            <strong className="font-extrabold text-[#2D3436]">{children}</strong>
          ),
          em: ({ children }) => (
            <em className="italic text-[#B2BEC3]">{children}</em>
          ),
          ul: ({ children }) => (
            <ul className="space-y-1 mb-2 pl-5 list-disc text-[#2D3436]">{children}</ul>
          ),
          ol: ({ children }) => (
            <ol className="space-y-1 mb-2 pl-5 list-decimal text-[#2D3436]">{children}</ol>
          ),
          li: ({ children }) => (
            <li className="text-[14px] leading-relaxed">{children}</li>
          ),
          code: ({ inline, children }: { inline?: boolean; children: React.ReactNode }) =>
            inline ? (
              <code className="bg-[#FFF0F7] text-[#FF3399] text-[12px] font-mono font-semibold px-1.5 py-0.5 rounded-md">
                {children}
              </code>
            ) : (
              <code className="block bg-[#2D3436] text-[#FFFFFF] text-[12px] font-mono px-4 py-2.5 rounded-xl my-2 overflow-x-auto leading-relaxed shadow-inner">
                {children}
              </code>
            ),
          pre: ({ children }) => (
            <pre className="bg-[#2D3436] rounded-xl my-2 overflow-x-auto shadow-inner">
              {children}
            </pre>
          ),
          blockquote: ({ children }) => (
            <blockquote className="border-l-4 border-[#00CEC9] bg-[#F0FFFE] pl-4 pr-3 py-2 my-2 rounded-r-xl">
              <div className="text-[13px] text-[#2D3436] font-medium italic leading-relaxed">
                {children}
              </div>
            </blockquote>
          ),
          hr: () => <hr className="border-[#E8ECF0] my-3" />,
          table: ({ children }) => (
            <div className="overflow-x-auto my-2 rounded-xl shadow-[0_2px_0_0_rgba(0,0,0,0.08)] bg-white">
              <table className="w-full text-[12px]">{children}</table>
            </div>
          ),
          thead: ({ children }) => (
            <thead className="bg-[#F7F9FB] border-b-2 border-[#E8ECF0]">{children}</thead>
          ),
          th: ({ children }) => (
            <th className="px-4 py-2 text-left font-bold text-[#2D3436] text-[11px] uppercase tracking-wider">
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td className="px-4 py-2 text-[#2D3436] border-b border-[#F7F9FB] last:border-b-0">
              {children}
            </td>
          ),
          a: ({ children, href }) => (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#FF3399] font-bold underline underline-offset-2 hover:text-[#D12A7E] transition-colors"
            >
              {children}
            </a>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}

// ─── Main Page ───────────────────────────────────────────────────────────────
export default function HybridSearchPage() {
  const {
    knowledgeBases,
    selectedKB,
    setSelectedKB,
    query,
    setQuery,
    loading,
    statusText,
    apiKey,
    setApiKey,
    showKey,
    setShowKey,
    // selectedModel,
    // setSelectedModel,
    results,
    llmResponse,
    handleSearch,
  } = useHybridSearch();

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="flex relative overflow-hidden flex-1 h-full w-full bg-white" style={{ fontFamily: "'Nunito', sans-serif" }}>

      {/* SIDEBAR */}
      <KnowledgeSidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        knowledgeBases={knowledgeBases}
        selectedKB={selectedKB}
        setSelectedKB={setSelectedKB}
        loading={loading}
        // selectedModel={selectedModel}
        // setSelectedModel={setSelectedModel}
        apiKey={apiKey}
        setApiKey={setApiKey}
        showKey={showKey}
        setShowKey={setShowKey}
      />

      {/* MAIN CONTENT AREA */}
      <div className="flex-1 flex flex-col h-full bg-[#F7F9FB] relative min-w-0">

        {/* SUB-HEADER (TOP NAV) */}
        <div className="h-16 bg-white flex items-center justify-between px-6 shrink-0 z-10 gap-3 shadow-[0_2px_0_0_rgba(0,0,0,0.04)]">
          <div className="flex items-center gap-2 text-[13px] font-bold text-[#B2BEC3] truncate">
            <BookOpen size={16} className="text-[#B2BEC3]" />
            <span>Nguồn tri thức hiện tại:</span>
            <span className={`px-3 py-1 rounded-full text-[12px] font-extrabold tracking-wide ${
              selectedKB 
                ? "bg-[#FFF0F7] text-[#FF3399]" 
                : "bg-[#F7F9FB] text-[#B2BEC3] italic"
            } truncate max-w-xs`}>
              {selectedKB || "Chưa thiết lập cấu hình"}
            </span>
          </div>

          {statusText && (
            <div className="text-[12px] font-bold text-[#00CEC9] bg-[#F0FFFE] px-3 py-1.5 rounded-full flex items-center gap-2 max-w-xs truncate shrink-0 shadow-[0_2px_0_0_rgba(0,0,0,0.04)]">
              <span className="w-2 h-2 rounded-full bg-[#00CEC9] animate-pulse shrink-0" />
              <span className="truncate">{statusText}</span>
            </div>
          )}
        </div>

        {/* RESULTS AREA */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6">

          {!query && !llmResponse && results.length === 0 && !loading && <></>}

          {/* AI Response + Reference Documents */}
          {(llmResponse || loading) && (
            <div className="space-y-6 max-w-4xl mx-auto">
              
              {/* AI Response Card */}
              <div className="bg-white rounded-2xl shadow-[0_2px_0_0_rgba(0,0,0,0.08)] overflow-hidden">
                <div className="px-5 py-3.5 flex items-center justify-between bg-[#F7F9FB]">
                  <div className="flex items-center gap-2.5">
                    <span className="flex items-center gap-1.5 text-[12px] font-extrabold text-[#2D3436] uppercase tracking-wider">
                      Kết quả tổng hợp
                    </span>
                  </div>
                </div>

                <div className="px-6 py-5">
                  {llmResponse ? (
                    <MarkdownContent content={llmResponse} />
                  ) : (
                    <div className="flex items-center gap-3 py-4">
                      <div className="flex gap-1">
                        <span className="w-2 h-2 rounded-full bg-[#FF3399] animate-bounce [animation-delay:-0.3s]" />
                        <span className="w-2 h-2 rounded-full bg-[#FF3399] animate-bounce [animation-delay:-0.15s]" />
                        <span className="w-2 h-2 rounded-full bg-[#FF3399] animate-bounce" />
                      </div>
                      <span className="text-[14px] text-[#B2BEC3] font-bold italic">
                        Đang rà soát và cấu trúc câu trả lời từ kho tri thức...
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Reference Documents Section (ĐÃ SỬA ĐỂ RENDER CHUẨN MARKDOWN) */}
              {results.length > 0 && (
                <div className="space-y-3">
                  <h4 className="text-[12px] font-extrabold text-[#B2BEC3] uppercase tracking-widest flex items-center gap-2 px-1">
                    Tài liệu tham chiếu ({results.length})
                  </h4>

                  <div className="grid grid-cols-1 gap-3">
                    {results.map((item, index) => {
                      if (!item.chunk) return null;
                      return (
                        <div
                          key={item.chunk.metadata?.chunkId || index}
                          className="group bg-white rounded-xl p-5 shadow-[0_2px_0_0_rgba(0,0,0,0.08)]"
                        >
                          {/* Card Header Info */}
                          <div className="flex items-center justify-between gap-4 mb-3 border-b border-[#F7F9FB] pb-2">
                            <div className="flex items-center gap-2 min-w-0">
                              <span className="shrink-0 text-[11px] font-extrabold text-white bg-[#00CEC9] px-2 py-0.5 rounded-md shadow-[0_2px_0_0_#00A8A3]">
                                TRÍCH ĐOẠN #{index + 1}
                              </span>
                              {item.chunk.metadata?.headings?.length > 0 && (
                                <span className="text-[13px] text-[#B2BEC3] font-bold truncate">
                                  {item.chunk.metadata.headings.join(" › ")}
                                </span>
                              )}
                            </div>
                            <span className="shrink-0 font-mono text-[11px] bg-[#F7F9FB] text-[#2D3436] px-2 py-0.5 rounded-md font-bold shadow-inner">
                              RRF {item.score.toFixed(4)}
                            </span>
                          </div>

                          {/* Nội dung đoạn văn - Đã chuyển sang dùng MarkdownContent */}
                          <div className="pl-4 border-l-4 border-[#FFF0F7] group-hover:border-[#FF3399] transition-colors duration-150">
                            <MarkdownContent content={item.chunk.content} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

            </div>
          )}
        </div>

        {/* FOOTER */}
        <footer className="px-4 py-6 bg-white shrink-0 z-10">
          <div className="max-w-3xl mx-auto">
            <form onSubmit={handleSearch} className="w-full flex items-center gap-3">
              <button
                type="button"
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                title="Cấu hình cơ sở tri thức"
                disabled={loading}
                className={`shrink-0 w-12 h-12 rounded-2xl transition-all duration-150 flex items-center justify-center border shadow-sm ${
                  isSidebarOpen 
                    ? "bg-[#FFF0F7] text-[#FF3399] border-[#FF3399]/30" 
                    : "bg-[#F7F9FB] text-[#B2BEC3] border-[#E8ECF0] hover:bg-[#E8ECF0] hover:text-[#2D3436]"
                }`}
              >
                <Database size={18} strokeWidth={2} />
              </button>
              <div 
                className={`flex-1 flex items-center bg-[#F7F9FB] rounded-2xl border border-[#E8ECF0] transition-all duration-200 ${
                  loading || !selectedKB 
                    ? "opacity-60 cursor-not-allowed" 
                    : "focus-within:bg-white focus-within:border-[#FF3399] focus-within:ring-4 focus-within:ring-[#FF3399]/5"
                }`}
              >
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={
                    selectedKB
                      ? "Hỏi bất cứ điều gì liên quan đến tài liệu học tập..."
                      : "Vui lòng click icon Database ở bên trái để thiết lập nguồn dữ liệu..."
                  }
                  disabled={loading || !selectedKB}
                  className="w-full bg-transparent font-sans text-[15px] font-medium text-[#2D3436] placeholder:text-[#B2BEC3] px-5 py-4 outline-none disabled:cursor-not-allowed"
                />
              </div>
              <button
                type="submit"
                disabled={loading || !selectedKB || !query.trim()}
                className={`shrink-0 w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-200 shadow-sm ${
                  query.trim() && !loading && selectedKB
                    ? "bg-[#2D3436] text-white hover:bg-[#FF3399] active:scale-95"
                    : "bg-[#E8ECF0] text-[#B2BEC3] cursor-not-allowed"
                }`}
              >
                {loading ? (
                  <span className="w-5 h-5 border-2 border-[#B2BEC3]/40 border-t-[#2D3436] rounded-full animate-spin" />
                ) : (
                  <Send size={16} strokeWidth={2.5} className={query.trim() ? "translate-x-[0.5px] -translate-y-[0.5px]" : ""} />
                )}
              </button>
            </form>

            <div className="mt-2 flex items-center justify-center px-2">
              <p className="text-[11px] font-medium text-[#B2BEC3] tracking-wide text-center">
                Hệ thống có thể đưa ra câu trả lời sai sót. Hãy kiểm tra lại các thông tin quan trọng.
              </p>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}