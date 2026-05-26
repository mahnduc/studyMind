"use client";

import React from "react";
import { User, Pencil } from "lucide-react";
import { useProfileStore } from "@/stores/profileStore";

export default function UserIdentification() {
  const profile = useProfileStore((state) => state.profile);
  const loadProfile = useProfileStore((state) => state.loadProfile);

  return (
    <section className="bg-white border-[1.5px] border-[#F0F0F0] rounded-[24px] p-8 mb-8 shadow-[0_2px_0_0_rgba(0,0,0,0.08)] relative overflow-hidden">
      <div className="flex flex-col items-center justify-center gap-6">
        
        {/* Avatar Container */}
        <div className="relative">
          <div className="w-32 h-32 rounded-full border-[1.5px] border-[#F0F0F0] p-1 bg-white">
            <div className="w-full h-full rounded-full bg-[#F7F9FB] flex items-center justify-center text-[#B2BEC3] overflow-hidden relative group">
              <User size={64} />
            </div>
          </div>

          {/* Nút Edit Avatar - Duolingo Style */}
          <button 
            className="absolute bottom-1 right-1 bg-[#FF3399] text-white p-2.5 rounded-full border-b-4 border-[#D12A7E] active:border-b-0 active:translate-y-[2px] transition-all"
            title="Update Avatar"
          >
            <Pencil size={16} strokeWidth={3} />
          </button>
        </div>

        {/* Thông tin User */}
        <div className="text-center space-y-2">
          <h2 className="text-[24px] font-[800] text-[#2D3436] leading-tight">
            {profile?.username}
          </h2>
          <div className="inline-block bg-[#F0F0F5] px-3 py-1 rounded-full">
            <span className="text-[12px] font-[600] text-[#2D3436] uppercase tracking-wide">
              Huy hiệu
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}