"use client";

import React, { useState, useEffect } from "react";
import {
  Volume2,
  Loader2,
  AlertCircle,
  BookOpen,
  ArrowLeft,
  Trash2,
  Plus,
  X,
  MirrorRectangular,
} from "lucide-react";
import { keyApi } from "../../settings/api-key/_api/key.api";
import { CustomDictionaryEntry, fetchDictionaryInsightFromGroq } from "../../courses/dictionary/useDictionary";
import Link from "next/link";

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

interface CollectionDetailProps {
  selectedCollection: string;
  wordsList: SavedWord[];
  isLoading: boolean;
  error: string | null;
  scrollbarClass: string;
  onBack: () => void;
  onSpeak: (text: string) => void;
  onRefresh: () => Promise<void>;
}

export default function CollectionDetail({
  selectedCollection,
  wordsList,
  isLoading,
  error,
  scrollbarClass,
  onBack,
  onSpeak,
  onRefresh,
}: CollectionDetailProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [deletingWordIndex, setDeletingWordIndex] = useState<number | null>(null);
  const [localWordsList, setLocalWordsList] = useState<SavedWord[]>(wordsList);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newWord, setNewWord] = useState("");
  const [isAddingWord, setIsAddingWord] = useState(false);

  useEffect(() => {
    setLocalWordsList(wordsList);
  }, [wordsList]);

  const handleDeleteCollection = async () => {
    const collectionName = selectedCollection.replace(".json", "");
    const confirmDelete = window.confirm(
      `Bạn có chắc chắn muốn xóa bộ sưu tập "${collectionName}" không? Hành động này không thể hoàn tác.`
    );
    if (!confirmDelete) return;
    setIsDeleting(true);
    try {
      const root = await navigator.storage.getDirectory();
      const dirHandle = await root.getDirectoryHandle("system-collections", { create: false });
      await dirHandle.removeEntry(selectedCollection);
      await onRefresh();
      onBack();
    } catch (err) {
      console.error("Lỗi khi xóa bộ sưu tập:", err);
      alert("Không thể xóa bộ sưu tập này. Vui lòng thử lại sau.");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDeleteWord = async (wordIndex: number, wordText: string) => {
    const confirmDelete = window.confirm(`Bạn có chắc chắn muốn xóa từ "${wordText}" khỏi bộ sưu tập không?`);
    if (!confirmDelete) return;
    setDeletingWordIndex(wordIndex);
    const updatedWordsList = localWordsList.filter((_, index) => index !== wordIndex);
    setLocalWordsList(updatedWordsList);
    try {
      const root = await navigator.storage.getDirectory();
      const dirHandle = await root.getDirectoryHandle("system-collections", { create: false });
      const fileHandle = await dirHandle.getFileHandle(selectedCollection, { create: false });
      const writable = await fileHandle.createWritable();
      await writable.write(JSON.stringify(updatedWordsList, null, 2));
      await writable.close();
      await onRefresh();
    } catch (err) {
      console.error("Lỗi khi xóa từ:", err);
      alert("Không thể xóa từ này. Vui lòng thử lại.");
      setLocalWordsList(wordsList);
    } finally {
      setDeletingWordIndex(null);
    }
  };

  const saveWordToCollection = async (entry: CustomDictionaryEntry) => {
    if (!entry.ai || !entry.ai.partsOfSpeech) return;
    const sanitizedPartsOfSpeech = entry.ai.partsOfSpeech.map((pos) => ({
      partOfSpeech: pos.partOfSpeech,
      definitionEn: pos.definitionEn,
      definitionVi: pos.definitionVi,
    }));
    const cleanDataToSave: SavedWord = {
      word: entry.word,
      phonetics: entry.phonetics?.map((p) => p.text).filter(Boolean) as string[],
      partsOfSpeech: sanitizedPartsOfSpeech,
    };
    const root = await navigator.storage.getDirectory();
    const dirHandle = await root.getDirectoryHandle("system-collections", { create: false });
    const fileHandle = await dirHandle.getFileHandle(selectedCollection, { create: false });
    let currentWords: SavedWord[] = [];
    try {
      const file = await fileHandle.getFile();
      const text = await file.text();
      if (text) {
        currentWords = JSON.parse(text);
      }
    } catch (err) {
      console.error(err);
    }
    const existingIndex = currentWords.findIndex(
      (w) => w.word.toLowerCase() === cleanDataToSave.word.toLowerCase()
    );
    if (existingIndex >= 0) {
      currentWords[existingIndex] = cleanDataToSave;
    } else {
      currentWords.push(cleanDataToSave);
    }
    const writable = await fileHandle.createWritable();
    await writable.write(JSON.stringify(currentWords, null, 2));
    await writable.close();
    setLocalWordsList(currentWords);
    await onRefresh();
  };

  const handleAddWord = async () => {
    if (!newWord.trim()) return;
    try {
      setIsAddingWord(true);
      const cleanWord = newWord.trim().toLowerCase();
      const apiKey = await keyApi.getRandomKey("groq");
      if (!apiKey) {
        throw new Error("Không tìm thấy API key.");
      }
      const aiData = await fetchDictionaryInsightFromGroq(cleanWord, apiKey);
      const generatedEntry: CustomDictionaryEntry = {
        word: aiData.word || cleanWord,
        phonetics: [{ text: aiData.phonetic || "", audio: "" }],
        ai: aiData,
      };
      await saveWordToCollection(generatedEntry);
      setNewWord("");
      setIsAddModalOpen(false);
    } catch (err) {
      console.error(err);
      alert("Không thể thêm từ mới.");
    } finally {
      setIsAddingWord(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            disabled={isDeleting || deletingWordIndex !== null}
            className="w-10 h-10 rounded-xl border border-slate-200 bg-slate-50 text-slate-600 hover:border-[#00CEC9] hover:text-[#00CEC9] active:scale-95 transition-all flex items-center justify-center disabled:opacity-50"
            title="Quay lại"
          >
            <ArrowLeft size={18} />
          </button>
          <div className="flex items-center gap-3">
            <div>
              <h2 className="text-lg font-extrabold text-slate-800">
                {selectedCollection.replace(".json", "")}
              </h2>
              <p className="text-xs text-slate-400 font-mono tracking-wider">
                {localWordsList.length} WORDS
              </p>
            </div>
            <Link href="/dashboard/courses/flashcard">
              <button
                className="w-8 h-8 rounded-lg bg-emerald-50/10 text-[#00CEC9] active:scale-95 transition-all flex items-center justify-center disabled:opacity-50"
                title="Flashcard"
              >
                <MirrorRectangular size={24} />
              </button>
            </Link>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-[#00CEC9] text-white hover:bg-[#00b2b0] rounded-xl text-xs font-bold uppercase tracking-wider transition-all duration-200"
          >
            <Plus size={15} strokeWidth={2.5} />
            Thêm từ mới
          </button>
          <button
            onClick={handleDeleteCollection}
            disabled={isDeleting || isLoading || deletingWordIndex !== null}
            className="flex items-center gap-2 px-4 py-2.5 bg-red-50 text-red-600 hover:bg-red-100/80 border border-red-200/60 rounded-xl text-xs font-bold uppercase tracking-wider transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {isDeleting ? (
              <>
                <Loader2 size={15} className="animate-spin" />
                Đang xóa...
              </>
            ) : (
              <Trash2 size={15} />
            )}
          </button>
        </div>
      </div>
      <div className={`min-h-[400px] ${scrollbarClass}`}>
        {isLoading ? (
          <div className="h-[300px] flex flex-col items-center justify-center gap-3">
            <Loader2 className="animate-spin text-[#00CEC9]" size={30} />
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Đang tải dữ liệu...
            </p>
          </div>
        ) : error ? (
          <div className="h-[300px] flex flex-col items-center justify-center text-center">
            <AlertCircle size={40} className="text-red-500 mb-3" />
            <p className="text-sm font-bold text-red-500">{error}</p>
          </div>
        ) : localWordsList.length === 0 ? (
          <div className="h-[300px] flex flex-col items-center justify-center">
            <BookOpen size={40} className="text-slate-200 mb-3" />
            <p className="text-sm font-bold text-slate-400">
              Bộ từ vựng này chưa có dữ liệu
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {localWordsList.map((item, index) => (
              <div
                key={`${item.word}-${index}`}
                className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all relative group"
              >
                <div className="flex items-start justify-between border-b border-slate-50 pb-3 mb-3">
                  <div>
                    <h3 className="text-lg font-bold text-slate-800 capitalize pr-16">
                      {item.word}
                    </h3>
                    {item.phonetics?.length > 0 && (
                      <span className="inline-block mt-1 text-xs font-mono bg-slate-50 border border-slate-200 px-2 py-1 rounded-lg text-slate-400">
                        {item.phonetics.join(", ")}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => onSpeak(item.word)}
                      className="p-2.5 bg-slate-50 hover:bg-[#FF3399]/10 border border-slate-200 hover:border-[#FF3399]/20 rounded-xl transition-all text-slate-600 hover:text-[#FF3399]"
                    >
                      <Volume2 size={15} />
                    </button>
                    <button
                      onClick={() => handleDeleteWord(index, item.word)}
                      disabled={deletingWordIndex !== null || isDeleting}
                      className="p-2.5 bg-slate-50 hover:bg-red-50 border border-slate-200 hover:border-red-200 rounded-xl transition-all text-slate-400 hover:text-red-500 disabled:opacity-40"
                      title="Xóa từ này"
                    >
                      {deletingWordIndex === index ? (
                        <Loader2 size={15} className="animate-spin" />
                      ) : (
                        <X size={15} />
                      )}
                    </button>
                  </div>
                </div>
                <div className="space-y-4">
                  {item.partsOfSpeech?.map((pos, posIdx) => (
                    <div key={posIdx} className="space-y-2">
                      <span className="inline-block text-[10px] uppercase tracking-wider font-extrabold px-2 py-1 rounded-lg bg-[#FF3399]/10 text-[#FF3399] border border-[#FF3399]/20">
                        {pos.partOfSpeech}
                      </span>
                      <div className="pl-3 border-l-2 border-slate-200 space-y-2">
                        <p className="text-sm font-semibold text-slate-800 leading-relaxed">
                          {pos.definitionEn}
                        </p>
                        <p className="text-sm text-slate-500 leading-relaxed">
                          {pos.definitionVi}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md space-y-5 shadow-xl">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-extrabold text-slate-800">
                Thêm từ mới
              </h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-2 rounded-xl hover:bg-slate-100"
              >
                <X size={18} />
              </button>
            </div>
            <input
              type="text"
              value={newWord}
              onChange={(e) => setNewWord(e.target.value)}
              placeholder="Ví dụ: beautiful"
              className="w-full border border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-[#00CEC9]"
            />
            <button
              onClick={handleAddWord}
              disabled={!newWord.trim() || isAddingWord}
              className="w-full h-12 rounded-xl bg-[#00CEC9] hover:bg-[#00b2b0] text-white font-bold transition-all disabled:opacity-40"
            >
              {isAddingWord ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 size={18} className="animate-spin" />
                  Đang tạo dữ liệu...
                </span>
              ) : (
                "Tạo & Lưu"
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}