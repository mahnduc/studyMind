"use client";

import { useEffect, useState } from "react";
import FlashCardViewer from "./_components/FlashCardViewer";
import { Folder, ArrowLeft, Loader2, Info, MirrorRectangular } from "lucide-react"; // Đảm bảo bạn đã cài lucide-react hoặc thay bằng SVG tương đương
import Link from "next/link";

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

  // 1. Quét danh sách các bộ sưu tập từ OPFS
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

  // 2. Tải dữ liệu thẻ khi một bộ sưu tập được chọn
  useEffect(() => {
    if (!selectedCollection) {
      setCards([]);
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

  // Hàm xử lý khi bấm nút Quay lại danh sách
  const handleBackToCollections = () => {
    setSelectedCollection("");
    setCards([]);
    setError(null);
  };

  return (
    <div className="min-h-full w-full bg-slate-50/50 flex flex-col" style={{ fontFamily: "'Nunito', sans-serif" }}>
      
      {/* KHU VỰC THÔNG BÁO LỖI */}
      {error && (
        <div className="mx-auto w-full max-w-4xl mt-4 px-4">
          <div className="w-full text-red-500 bg-red-50 px-4 py-3 rounded-2xl border border-red-100 text-center text-sm font-semibold shadow-xs">
            {error}
          </div>
        </div>
      )}

      {/* CHẾ ĐỘ 1: ĐANG TẢI DỮ LIỆU */}
      {isLoading ? (
        <div className="flex-1 flex flex-col items-center justify-center text-slate-400 gap-3">
          <Loader2 className="w-8 h-8 text-[#00CEC9] animate-spin" />
          <span className="text-sm font-bold tracking-wide text-slate-600">Đang đồng bộ dữ liệu hệ thống...</span>
        </div>
      ) : !selectedCollection ? (
        
        /* CHẾ ĐỘ 2: DANH SÁCH BỘ SƯU TẬP (Hiển thị trực tiếp) */
        <div className="flex-1 max-w-6xl w-full mx-auto px-6 py-10 space-y-8">
          <div>
            <h1 className="text-2xl font-black text-slate-800 tracking-tight">Flashcard</h1>
            <p className="text-sm text-slate-500 mt-1">Hãy chọn một bộ từ vựng để bắt đầu học.</p>
          </div>

          {collections.length === 0 ? (
            <div className="bg-white border border-slate-100 rounded-3xl p-12 text-center shadow-xs">
              <MirrorRectangular className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-base font-bold text-slate-700">Chưa có bộ sưu tập nào</p>
              <p className="text-xs text-slate-400 max-w-xs mx-auto mt-1 leading-relaxed">
                Vui lòng thêm các tệp dữ liệu định dạng cấu trúc <code className="bg-slate-100 px-1 py-0.5 rounded text-red-500">.json</code> vào thư mục lưu trữ.
              </p>
            </div>
          ) : (
            /* Lưới danh sách các Card */
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
              {collections.map((name) => (
                <div
                  key={name}
                  onClick={() => setSelectedCollection(name)}
                  className="bg-white border border-slate-100 p-5 rounded-2xl shadow-xs hover:shadow-md hover:border-[#00CEC9]/30 transition-all duration-200 cursor-pointer flex items-center gap-4 group"
                >
                  <div className="bg-[#00CEC9]/10 text-[#00CEC9] p-3 rounded-xl group-hover:bg-[#00CEC9] group-hover:text-white transition-colors duration-200 shrink-0">
                    <MirrorRectangular size={22} className="stroke-[2.5]" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-bold text-slate-800 text-base truncate group-hover:text-[#00CEC9] transition-colors">
                      {name}
                    </h3>
                    <p className="text-[11px] text-slate-400 font-medium mt-0.5">Nhấp để mở thẻ ghi nhớ</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        

        <div className="flex-1 w-full flex flex-col p-6 max-w-4xl mx-auto">
          <div className="flex items-center justify-between w-full mb-6">
            <button
              onClick={handleBackToCollections}
              className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 hover:text-slate-900 shadow-xs text-sm font-bold transition-all duration-150"
            >
              <ArrowLeft size={16} className="stroke-[2.5]" />
              Quay lại danh sách
            </button>
            <div className="text-right">
              <span className="text-[11px] font-black uppercase tracking-wider text-[#00CEC9] bg-[#00CEC9]/10 px-2.5 py-1 rounded-md">
                {selectedCollection}
              </span>
            </div>
          </div>

          <div className="flex-1 flex flex-col items-center justify-start w-full">
            {cards.length > 0 ? (
              <FlashCardViewer
                cards={cards}
                currentIndex={currentIndex}
                isFlipped={isFlipped}
                setIsFlipped={setIsFlipped}
                nextCard={nextCard}
                prevCard={prevCard}
              />
            ) : (
              <div className="my-auto flex flex-col items-center justify-center text-slate-400 gap-3 text-center">
                <Info className="w-10 h-10 text-slate-300" />
                <div>
                  <p className="font-bold text-base text-slate-700">Bộ sưu tập trống</p>
                  <p className="text-xs text-[#3a21fc] max-w-xs leading-relaxed mt-1 font-bold">
                    <Link href="/dashboard/collections">Đến bộ sưu tập để thêm từ vựng mới</Link>.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}