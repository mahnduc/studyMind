"use client";

import { useEffect, useState } from "react";
import FlashCardViewer from "./_components/FlashCardViewer";
import { Sidebar } from "lucide-react";

interface PartOfSpeech {
  partOfSpeech: string;
  definitionEn: string;
  definitionVi: string;
}

interface FlashCardItem {
  word: string;
  phonetics: string[];
  partsOfSpeech: PartOfSpeech[];
}

interface FlashCardProps {
  initialCollection?: string;
}

export default function FlashCard({ initialCollection = "" }: FlashCardProps) {
  const [collections, setCollections] = useState<string[]>([]);
  const [selectedCollection, setSelectedCollection] = useState<string>(initialCollection);
  const [cards, setCards] = useState<FlashCardItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [isFlipped, setIsFlipped] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isCollapsed, setIsCollapsed] = useState<boolean>(true); 
  
  useEffect(() => {
    async function loadCollections() {
      try {
        setIsLoading(true);
        const root = await navigator.storage.getDirectory();
        const dirHandle = await root.getDirectoryHandle("system-collections", {
          create: true,
        });

        const fileNames: string[] = [];
        for await (const entry of dirHandle.values()) {
          if (entry.kind === "file" && entry.name.endsWith(".json")) {
            fileNames.push(entry.name.replace(".json", ""));
          }
        }

        setCollections(fileNames);
        
        // Không tự động chọn phần tử đầu tiên
        if (initialCollection && fileNames.includes(initialCollection)) {
          setSelectedCollection(initialCollection);
        } else {
          setSelectedCollection(""); 
        }
      } catch (err) {
        console.error("Lỗi OPFS:", err);
        setError("Không thể quét thư mục bộ sưu tập.");
      } finally {
        setIsLoading(false);
      }
    }

    loadCollections();
  }, [initialCollection]);

  useEffect(() => {
    if (!selectedCollection) {
      setCards([]);
      setIsLoading(false);
      return;
    }

    async function loadCardData() {
      try {
        setIsLoading(true);
        const root = await navigator.storage.getDirectory();
        const dirHandle = await root.getDirectoryHandle("system-collections");
        const fileHandle = await dirHandle.getFileHandle(`${selectedCollection}.json`);
        
        const file = await fileHandle.getFile();
        const text = await file.text();
        const data: FlashCardItem[] = JSON.parse(text);

        setCards(data);
        setCurrentIndex(0);
        setIsFlipped(false);
        setError(null);
      } catch (err) {
        console.error("Lỗi đọc file JSON:", err);
        setError(`Lỗi đọc bộ sưu tập: ${selectedCollection}`);
        setCards([]);
      } finally {
        setIsLoading(false);
      }
    }

    loadCardData();
  }, [selectedCollection]);

  const nextCard = () => {
    if (cards.length === 0) return;
    setIsFlipped(false);
    setTimeout(() => {
      setCurrentIndex((prev) => (prev + 1) % cards.length);
    }, 155);
  };

  const prevCard = () => {
    if (cards.length === 0) return;
    setIsFlipped(false);
    setTimeout(() => {
      setCurrentIndex((prev) => (prev - 1 + cards.length) % cards.length);
    }, 155);
  };

  const currentCard = cards[currentIndex];

  return (
    <div className="flex relative overflow-hidden flex-1 h-full w-full bg-white" style={{ fontFamily: "'Nunito', sans-serif" }}>

      {/* Sidebar */}
      <div className={`h-full bg-white border-r border-slate-200 flex flex-col transition-all duration-300 ease-in-out relative flex-shrink-0 ${
          isCollapsed ? "w-0 opacity-0 pointer-events-none" : "w-64 opacity-100"
        }`}
      >
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-800 tracking-wide">Bộ Sưu Tập</h2>
          </div>
          
          <button
            onClick={() => setIsCollapsed(true)}
            className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
            title="Thu gọn thanh menu"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-1">
          {collections.length === 0 ? (
            <div className="text-sm text-slate-400 text-center py-8 font-medium">
              Chưa có bộ sưu tập nào.
            </div>
          ) : (
            collections.map((name) => {
              const isSelected = selectedCollection === name;
              return (
                <button
                  key={name}
                  onClick={() => setSelectedCollection(name)}
                  className={`w-full text-left px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200 flex items-center justify-between group ${
                    isSelected
                      ? "bg-[#00CEC9] text-white shadow-md"
                      : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                  }`}
                >
                  <div className="flex items-center space-x-3 truncate">
                    <span className="truncate">{name}</span>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* Button mở Sidebar */}
      {isCollapsed && (
        <button
          onClick={() => setIsCollapsed(false)}
          className="absolute left-4 top-4 z-50 p-2.5 bg-white border border-slate-200 rounded-xl text-slate-500 hover:text-slate-800 shadow-sm hover:shadow-md transition-all duration-200"
          title="Mở rộng thanh menu"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13 5l7 7-7 7M5 5l7 7-7 7" />
          </svg>
        </button>
      )}

      {/* Khu vực nội dung chính */}
      <div className="flex flex-col items-center justify-start w-full h-full p-6 overflow-y-auto bg-slate-50/50">       

        {error && (
          <div className="w-full max-w-md text-red-500 bg-red-50 px-4 py-2.5 rounded-xl border border-red-200 mb-4 text-center text-sm font-medium">
            {error}
          </div>
        )}

        {isLoading ? (
          <div className="flex-1 flex items-center justify-center text-slate-400 text-sm font-semibold animate-pulse">
            Đang đồng bộ dữ liệu từ hệ thống lưu trữ...
          </div>
        ) : !selectedCollection ? (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-400 gap-3 mt-12">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-12 h-12 text-[#00CEC9] animate-pulse">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5M12 17.25h8.25" />
            </svg>
            <p className="font-bold text-base text-slate-700">Mở menu để chọn bộ sưu tập</p>
          </div>
        ) : cards.length > 0 && currentCard ? (
          <FlashCardViewer
            cards={cards}
            currentIndex={currentIndex}
            isFlipped={isFlipped}
            setIsFlipped={setIsFlipped}
            nextCard={nextCard}
            prevCard={prevCard}
          />
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-400 gap-2 mt-12">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-10 h-10 text-slate-300">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 10.5v6m3-3H9m4.06-7.19l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z" />
            </svg>
            <p className="font-bold text-sm text-slate-500">Bộ sưu tập này chưa có dữ liệu</p>
            <p className="text-[11px] max-w-xs text-center text-slate-400 leading-normal">
              Vui lòng kiểm tra lại file <code className="bg-slate-200 text-red-500 px-1 py-0.5 rounded">{selectedCollection}.json</code> trong thư mục OPFS.
            </p>
          </div>
        )}
      </div>

    </div>
  );
}