'use client';

import React, { useState, useEffect } from 'react';
import { Folder, X, FileJson, Plus, Check } from 'lucide-react';
import { toast } from 'react-toastify';
import { CustomDictionaryEntry } from '../useDictionary';

interface CollectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentWordEntry: CustomDictionaryEntry | null;
  allPhonetics: any[];
  onSaveSuccess: () => void;
}

export default function CollectionModal({
  isOpen,
  onClose,
  currentWordEntry,
  allPhonetics,
  onSaveSuccess,
}: CollectionModalProps) {
  const [collections, setCollections] = useState<string[]>([]);
  const [newCollectionName, setNewCollectionName] = useState('');

  const loadCollections = async () => {
    try {
      const root = await navigator.storage.getDirectory();
      const dirHandle = await root.getDirectoryHandle('system-collections', { create: true });
      
      const fileNames: string[] = [];
      // @ts-ignore
      for await (const entry of dirHandle.values()) {
        if (entry.kind === 'file' && entry.name.endsWith('.json')) {
          fileNames.push(entry.name);
        }
      }
      setCollections(fileNames);
    } catch (err) {
      console.error('Lỗi khi kiểm tra thư mục OPFS:', err);
      toast.error('Không thể tải danh sách bộ sưu tập.');
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadCollections();
    }
  }, [isOpen]);

  // Hàm kiểm tra từ vựng đã tồn tại trong bộ sưu tập hay chưa trước khi lưu
  const checkWordExistsInCollection = async (dirHandle: FileSystemDirectoryHandle, fileName: string, word: string): Promise<boolean> => {
    try {
      const fileHandle = await dirHandle.getFileHandle(fileName);
      const file = await fileHandle.getFile();
      const text = await file.text();
      if (!text) return false;
      
      const words: any[] = JSON.parse(text);
      return words.some(w => w.word.toLowerCase() === word.toLowerCase());
    } catch (e) {
      return false; // File chưa tồn tại hoặc rỗng
    }
  };

  const saveWordToOPFS = async (fileName: string, entry: CustomDictionaryEntry) => {
    try {
      if (!entry.ai || !entry.ai.partsOfSpeech) {
        toast.warning('Dữ liệu từ vựng không hợp lệ để lưu trữ.');
        return;
      }

      const sanitizedPartsOfSpeech = entry.ai.partsOfSpeech.map(pos => ({
        partOfSpeech: pos.partOfSpeech,
        definitionEn: pos.definitionEn,
        definitionVi: pos.definitionVi
      }));

      const cleanDataToSave = {
        word: entry.word,
        phonetics: allPhonetics.map(p => p.text).filter(Boolean),
        partsOfSpeech: sanitizedPartsOfSpeech
      };

      const root = await navigator.storage.getDirectory();
      const dirHandle = await root.getDirectoryHandle('system-collections', { create: true });
      
      // Thực hiện kiểm tra trùng lặp từ vựng
      const isAlreadyExists = await checkWordExistsInCollection(dirHandle, fileName, cleanDataToSave.word);
      
      const fileHandle = await dirHandle.getFileHandle(fileName, { create: true });
      let currentWords: any[] = [];
      
      try {
        const file = await fileHandle.getFile();
        const text = await file.text();
        if (text) {
          currentWords = JSON.parse(text);
        }
      } catch (e) {
        // File mới tạo hoặc bị lỗi định dạng
      }

      if (!isAlreadyExists) {
        currentWords.push(cleanDataToSave);
      } else {
        currentWords = currentWords.map(w => 
          w.word.toLowerCase() === cleanDataToSave.word.toLowerCase() ? cleanDataToSave : w
        );
      }

      const writable = await (fileHandle as any).createWritable();
      await writable.write(JSON.stringify(currentWords, null, 2));
      await writable.close();

      // Cập nhật lại danh sách nếu là file mới tạo
      if (!collections.includes(fileName)) {
        await loadCollections();
      }

      onSaveSuccess();
      
      const collectionDisplayName = fileName.replace('.json', '');
      if (isAlreadyExists) {
        toast.info(`Đã cập nhật lại từ "${cleanDataToSave.word}" vào bộ sưu tập: ${collectionDisplayName}`);
      } else {
        toast.success(`Đã thêm thành công từ "${cleanDataToSave.word}" vào bộ sưu tập: ${collectionDisplayName}`);
      }

      onClose();
    } catch (err) {
      console.error('Lỗi thao tác lưu trữ file OPFS:', err);
      toast.error('Không thể hoàn tất lưu trữ. Vui lòng thử lại.');
    }
  };

  const handleCreateAndSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCollectionName.trim() || !currentWordEntry) return;

    let fileName = newCollectionName.trim();
    if (!fileName.endsWith('.json')) {
      fileName += '.json';
    }

    await saveWordToOPFS(fileName, currentWordEntry);
    setNewCollectionName('');
  };

  const handleSelectAndSave = async (fileName: string) => {
    if (!currentWordEntry) return;
    await saveWordToOPFS(fileName, currentWordEntry);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
      <div className="bg-white w-full max-w-md rounded-[24px] p-6 shadow-xl space-y-5 animate-in fade-in zoom-in-95 duration-150 relative overflow-hidden">
        
        <div className="flex items-center justify-between border-b border-[#e9eceb] pb-3">
          <div className="flex items-center gap-2 text-[#2d3436]">
            <Folder size={18} className="text-[#00cec9]" />
            <h3 className="text-sm font-['Nunito'] font-[900] uppercase tracking-wide">Bộ sưu tập cá nhân</h3>
          </div>
          <button 
            type="button" 
            onClick={onClose}
            className="text-[#2d3436]/40 hover:text-[#2d3436] p-1 rounded-full bg-[#f7f9f8] transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        <div className="space-y-2">
          <p className="text-xs text-[#2d3436]/50">Chọn một bộ sưu tập có sẵn (Lưu nghĩa gốc - Bỏ qua ví dụ):</p>
          {collections.length === 0 ? (
            <div className="text-center p-6 border-2 border-dashed border-[#e9eceb] rounded-[16px] text-xs text-[#2d3436]/40">
              Chưa có tệp lưu trữ nào trong hệ thống dữ liệu OPFS.
            </div>
          ) : (
            <div className="max-h-[160px] overflow-y-auto space-y-1.5 pr-1">
              {collections.map((fileName) => {
                const displayName = fileName.replace('.json', '');
                
                return (
                  <button
                    type="button"
                    key={fileName}
                    onClick={() => handleSelectAndSave(fileName)}
                    className="w-full flex items-center justify-between text-left text-xs px-3 py-2.5 bg-[#f7f9f8] hover:bg-[#00cec910] text-[#2d3436] font-medium rounded-[12px] group transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-2 truncate">
                      <FileJson size={14} className="text-[#2d3436]/30 group-hover:text-[#00cec9] transition-colors" />
                      <span className="truncate font-mono">{displayName}</span>
                    </div>
                    <span className="text-[10px] text-[#00cec9] opacity-0 group-hover:opacity-100 font-sans font-bold flex items-center gap-1 transition-opacity">
                      Lưu tinh gọn <Check size={10} />
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div className="border-t border-[#e9eceb] pt-4 space-y-2">
          <p className="text-xs text-[#2d3436]/50">Hoặc khởi tạo tập hợp mới:</p>
          <form onSubmit={handleCreateAndSave} className="flex gap-2 w-full">
            <input
              type="text"
              placeholder="Ví dụ: Tuvung..."
              value={newCollectionName}
              onChange={(e) => setNewCollectionName(e.target.value)}
              className="flex-1 bg-[#f7f9f8] rounded-[12px] px-3.5 py-2.5 text-xs font-mono text-[#2d3436] placeholder:font-sans placeholder:text-[#2d3436]/30 outline-none border border-transparent focus:border-[#00cec9]/30 transition-all"
            />
            <button
              type="submit"
              disabled={!newCollectionName.trim()}
              className="bg-[#2d3436] text-white px-3 rounded-[12px] flex items-center justify-center gap-1.5 font-sans font-bold text-xs disabled:opacity-30 disabled:cursor-not-allowed hover:bg-[#FF3399] transition-colors cursor-pointer"
            >
              <Plus size={14} /> Tạo & Lưu
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}