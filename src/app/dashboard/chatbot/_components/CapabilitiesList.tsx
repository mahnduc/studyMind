'use client';

import React from 'react';
import { Database, Search } from 'lucide-react';

const CAPABILITIES = [
  {
    title: 'Tra cứu tài liệu',
    description: 'Tìm kiếm và tra cứu tài liệu cá nhân của bạn',
    color: 'border-[#1CB0F6]',
    iconColor: 'text-[#1CB0F6]',
    prompt: 'Sử dụng công cụ tra cứu tài liệu',
    icon: Search
  },
  {
    title: 'Sinh trắc nghiệm',
    description: 'Tạo bộ câu hỏi cho tài liệu của bạn.',
    color: 'border-[#FFC800]',
    iconColor: 'text-[#FFC800]',
    prompt: 'Sử dụng công cụ tạo trắc nghiệm',
    icon: Database
  },
];

interface Props {
  onSelect: (prompt: string) => void;
}

export const CapabilitiesList = ({ onSelect }: Props) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2 mb-4 animate-in fade-in slide-in-from-bottom-2 duration-500">
      {CAPABILITIES.map((cap, index) => {
        const Icon = cap.icon;
        return (
          <div 
            key={index}
            onClick={() => onSelect(cap.prompt)} // Kích hoạt khi bấm
            className={`
              p-4 bg-white border-2 ${cap.color} border-b-4 
              rounded-2xl transition-all cursor-pointer
              hover:-translate-y-1 hover:brightness-95
              active:translate-y-0 active:border-b-0
              flex flex-col gap-2 shadow-sm
            `}
          >
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gray-50 rounded-xl">
                <Icon className={cap.iconColor} size={24} />
              </div>
              <h3 className="font-extrabold text-[#2D3436] text-[15px]">
                {cap.title}
              </h3>
            </div>
            <p className="text-sm text-[#777] font-medium leading-tight">
              {cap.description}
            </p>
          </div>
        );
      })}
    </div>
  );
};