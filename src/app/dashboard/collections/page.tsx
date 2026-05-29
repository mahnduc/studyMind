"use client";
import React, { useState, useEffect } from "react";
import { BookOpen, FolderOpen, FileJson, Plus, X, BookMarked, Bookmark } from "lucide-react";
import CollectionDetail from "./_components/CollectionDetail";

interface PartOfSpeech {
  partOfSpeech: string;
  definitionEn: string;
  definitionVi: string;
}

interface SavedWord {
  word: string;
  phonetics: string[];
  partsOfSpeech: PartOfSpeech[];
}

export default function CollectionPage() {
  const [collections, setCollections] = useState<string[]>([]);
  const [selectedCollection, setSelectedCollection] = useState<string | null>(null);
  const [wordsList, setWordsList] = useState<SavedWord[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [newCollectionName, setNewCollectionName] = useState<string>("");
  const scrollbarClass = "overflow-y-auto [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar]:h-1.5 [&::-webkit-scrollbar-thumb]:bg-[#E5E5E5] [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-[#B2BEC3]";
  
  const handleSpeak = (text: string) => {
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = "en-US";
      utterance.rate = 0.9;
      window.speechSynthesis.speak(utterance);
    }
  };

  const loadCollections = async () => {
    try {
      const root = await navigator.storage.getDirectory();
      const dirHandle = await root.getDirectoryHandle("system-collections", { create: true });
      const fileNames: string[] = [];
      // @ts-ignore
      for await (const entry of dirHandle.values()) {
        if (entry.kind === "file" && entry.name.endsWith(".json")) {
          fileNames.push(entry.name);
        }
      }
      setCollections(fileNames);
    } catch (err) {
      console.error("Lỗi quét thư mục OPFS:", err);
    }
  };

  useEffect(() => {
    loadCollections();
  }, []);

  const handleCreateCollection = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = newCollectionName.trim();
    if (!trimmedName) return;
    const fileName = trimmedName.endsWith(".json") ? trimmedName : `${trimmedName}.json`;
    try {
      const root = await navigator.storage.getDirectory();
      const dirHandle = await root.getDirectoryHandle("system-collections", { create: true });
      const fileHandle = await dirHandle.getFileHandle(fileName, { create: true });
      const writable = await fileHandle.createWritable();
      await writable.write(JSON.stringify([]));
      await writable.close();
      setNewCollectionName("");
      setIsModalOpen(false);
      await loadCollections();
    } catch (err) {
      console.error("Lỗi tạo bộ sưu tập mới:", err);
    }
  };

  const handleSelectCollection = async (fileName: string) => {
    setSelectedCollection(fileName);
    setIsLoading(true);
    setError(null);
    try {
      const root = await navigator.storage.getDirectory();
      const dirHandle = await root.getDirectoryHandle("system-collections", { create: true });
      const fileHandle = await dirHandle.getFileHandle(fileName);
      const file = await fileHandle.getFile();
      const text = await file.text();
      const cleanText = text.trim();
      if (cleanText && cleanText !== "[]" && cleanText !== "{}") {
        try {
          const parsedData = JSON.parse(cleanText);
          const cleanData: SavedWord[] = Array.isArray(parsedData) ? parsedData : [parsedData];
          setWordsList(cleanData);
        } catch (parseErr) {
          console.error("Lỗi định dạng JSON:", parseErr);
          setWordsList([]);
          setError("Tệp JSON không hợp lệ.");
        }
      } else {
        setWordsList([]);
      }
    } catch (err) {
      console.error("Lỗi hệ thống tập tin:", err);
      setWordsList([]);
      setError("Không thể đọc file.");
    } finally {
      setIsLoading(false);
    }
  };

return (
    <div className="w-full max-w-7xl mx-auto p-6 md:p-10 bg-slate-50 min-h-screen selection:bg-[#00CEC9]/20 selection:text-[#00b2b0]">
      {!selectedCollection && (
        <div className="space-y-8 animate-in fade-in duration-300">
          <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-2 h-8 bg-[#00CEC9] rounded-full shadow-[0_0_10px_rgba(0,206,201,0.4)]"></div>
              <div>
                <h1 className="text-xl font-extrabold tracking-tight text-slate-800 md:text-2xl">
                  Bộ sưu tập từ vựng
                </h1>
                <p className="text-xs text-slate-400 font-semibold tracking-wider mt-0.5 flex items-center gap-1.5">
                  <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  LOCAL STORAGE
                </p>
              </div>
            </div>
            <button
              onClick={() => setIsModalOpen(true)}
              className="flex items-center gap-2 px-5 py-3 bg-[#00CEC9] text-white rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-[#00b2b0] active:scale-95 transition-all duration-200 shadow-md shadow-[#00CEC9]/10"
            >
              <Plus size={16} strokeWidth={2.5} />
              Tạo bộ sưu tập mới
            </button>
          </div>

          {collections.length === 0 ? (
            <div className="h-[350px] bg-white border border-slate-200/60 rounded-3xl flex flex-col items-center justify-center text-center p-6 shadow-inner bg-gradient-to-b from-white to-slate-50/50">
              <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mb-4 text-slate-400 border border-slate-200/40">
                <BookOpen size={28} strokeWidth={1.5} />
              </div>
              <h3 className="text-base font-bold text-slate-700">Chưa có bộ sưu tập nào</h3>
              <p className="text-xs text-slate-400 mt-1 max-w-[280px]">
                Hãy tạo bộ sưu tập đầu tiên để bắt đầu lưu trữ và ôn luyện từ vựng của bạn.
              </p>
              <button
                onClick={() => setIsModalOpen(true)}
                className="mt-5 px-4 py-2 text-xs font-bold text-[#00CEC9] bg-[#00CEC9]/10 rounded-lg hover:bg-[#00CEC9]/20 transition-colors"
              >
                Tạo ngay
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {collections.map((fileName, index) => (
                <button
                  key={index}
                  onClick={() => handleSelectCollection(fileName)}
                  className="bg-white border border-[#00CEC9]/40 rounded-2xl p-6 text-left shadow-[0_8px_30px_rgb(0,206,201,0.04)] transition-all duration-300 ease-out"
                >
                  <div className="flex items-start justify-between mb-6">
                    <div className="w-12 h-12 rounded-xl bg-[#00CEC9]/10 flex items-center justify-center border border-[#00CEC9]/20 scale-105 transition-all duration-300">
                      <FolderOpen size={22} className="text-[#00CEC9]" />
                    </div>
                    <Bookmark
                      size={18}
                      className="text-[#00CEC9]/80"
                    />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900 tracking-tight transition-colors truncate">
                      {fileName.replace(".json", "")}
                    </h3>
                    <p className="text-[11px] text-slate-500 mt-1 font-medium transition-colors">
                      Nhấp để xem chi tiết từ vựng
                    </p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {selectedCollection && (
        <div className="animate-in fade-in duration-300">
          <CollectionDetail
            selectedCollection={selectedCollection}
            wordsList={wordsList}
            isLoading={isLoading}
            error={error}
            scrollbarClass={scrollbarClass}
            onSpeak={handleSpeak}
            onRefresh={loadCollections} 
            onBack={() => {
              setSelectedCollection(null);
              setWordsList([]);
            }}
          />
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white border border-slate-100 rounded-2xl p-6 w-full max-w-md shadow-2xl relative animate-in zoom-in-95 duration-200">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-all"
            >
              <X size={16} strokeWidth={2.5} />
            </button>

            <div className="mb-5">
              <h2 className="text-base font-bold text-slate-800 tracking-tight">
                Tạo bộ sưu tập mới
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Tách biệt từ vựng theo các chủ đề học tập riêng của bạn.
              </p>
            </div>

            <form onSubmit={handleCreateCollection} className="space-y-5">
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">
                  Tên bộ từ vựng
                </label>
                <input
                  type="text"
                  value={newCollectionName}
                  onChange={(e) => setNewCollectionName(e.target.value)}
                  placeholder="Ví dụ: IELTS Wordlist, Oxford 3000..."
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-[#00CEC9] focus:ring-2 focus:ring-[#00CEC9]/10 text-slate-700 font-medium placeholder:text-slate-400 bg-slate-50 transition-all"
                  autoFocus
                />
              </div>

              <div className="flex gap-3 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  disabled={!newCollectionName.trim()}
                  className="px-5 py-2.5 rounded-xl bg-[#00CEC9] text-white text-xs font-bold uppercase tracking-wider hover:bg-[#00b2b0] transition-all shadow-sm shadow-[#00CEC9]/10 disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none"
                >
                  Xác nhận
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}