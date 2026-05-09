'use client';

import React, { useEffect, useState } from 'react';
import { Book, FolderOpen, Clock, Loader2 } from 'lucide-react';

interface KBItem {
  id: string;
  name: string;
  count: number;
  lastUpdated: string;
  icon: any;
}

interface Props {
  onSelect?: (kbName: string) => void;
}

export const KnowledgeBaseList = ({ onSelect }: Props) => {
  const [kbList, setKbList] = useState<KBItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const scanOPFS = async () => {
      try {
        setLoading(true);
        const root = await navigator.storage.getDirectory();
        
        const workspaceHandle = await root.getDirectoryHandle('my-workspace', { create: true });
        
        const items: KBItem[] = [];

        for await (const [name, handle] of workspaceHandle.entries()) {
          if (handle.kind === 'directory') {
            let fileCount = 0;
            // @ts-ignore
            for await (const _ of handle.keys()) { fileCount++; }

            items.push({
              id: name,
              name: name,
              count: fileCount,
              lastUpdated: 'Vừa xong',
              icon: FolderOpen,
            });
          }
        }

        // Nếu không có thư mục nào, hiển thị mặc định
        setKbList(items);
      } catch (error) {
        console.error("Lỗi truy cập OPFS:", error);
      } finally {
        setLoading(false);
      }
    };

    scanOPFS();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="animate-spin text-blue-500" size={24} />
      </div>
    );
  }

  if (kbList.length === 0) {
    return (
      <div className="p-6 text-center bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
        <p className="text-sm text-gray-500 font-medium">
          Không tìm thấy dữ liệu nào trong kho
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-3 mt-2 animate-in fade-in slide-in-from-bottom-2 duration-500">
      <p className="text-xs font-bold text-gray-400 uppercase ml-1">Kho tri thức từ Workspace:</p>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {kbList.map((kb) => {
          const Icon = kb.icon;
          return (
            <div
              key={kb.id}
              onClick={() => onSelect?.(kb.name)}
              className="group p-4 bg-white border-2 border-b-4 border-blue-400 rounded-2xl 
                cursor-pointer transition-all hover:brightness-95 active:border-b-0 active:translate-y-[2px]
                flex flex-col gap-2 shadow-sm"
            >
              <div className="flex justify-between items-start">
                <div className="p-2 bg-blue-50 text-blue-500 rounded-xl group-hover:bg-white transition-colors">
                  <Icon size={20} />
                </div>
                <div className="flex items-center gap-1 text-[10px] text-gray-400 font-bold">
                  <Clock size={12} />
                  {kb.lastUpdated}
                </div>
              </div>

              <div>
                <h4 className="font-extrabold text-gray-700 text-sm truncate">{kb.name}</h4>
                <p className="text-xs text-gray-500 font-medium">{kb.count} mục tri thức</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};