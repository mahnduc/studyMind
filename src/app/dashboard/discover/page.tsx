"use client";

import { Search } from "lucide-react";
import Link from "next/link";

export default function DiscoverPage() {
  return (
    <div 
      className="flex flex-col md:grid md:grid-cols-3 gap-6 p-6 overflow-y-auto flex-1 h-full w-full bg-[#f7f9f8]" 
      style={{ fontFamily: "'Nunito', sans-serif" }}
    >
      <div className="md:col-span-2 flex flex-col justify-between p-6 bg-white rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow duration-200">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-[#FF3399]/10 text-[#FF3399]">
            Trợ lý AI
          </span>
          <h3 className="text-xl font-extrabold text-[#2d3436] mt-3">Thiết lập mục tiêu</h3>
          <p className="text-sm text-[#2d3436]/70 mt-2 max-w-md">
            Agent thông minh hỗ trợ phân tích dữ liệu và thiết lập lộ trình học tập, rèn luyện cá nhân hóa dành riêng cho bạn.
          </p>
        </div>
        <div className="mt-6 flex justify-end">
          <Link href="/dashboard/goal">
            <button className="px-4 py-2 text-sm font-semibold text-white bg-[#FF3399] rounded-xl hover:bg-[#FF3399]/90 active:scale-95 transition-all">
              Bắt đầu ngay
            </button>
          </Link>
        </div>
      </div>

      <div className="group flex flex-col justify-between p-6 bg-white rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow duration-200">
        <div>
            <div className="flex justify-between items-start">
            <div className="w-12 h-12 flex items-center justify-center rounded-xl bg-[#00cec9]/10 text-[#00cec9]">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
            </div>
            </div>
            
            <div className="mt-4">
            <h4 className="text-lg font-bold text-[#2d3436] group-hover:text-[#00cec9] transition-colors">Thư viện</h4>
            <p className="text-xs text-[#2d3436]/60 mt-1">Lưu trữ, quản lý và trích xuất tri thức từ các nguồn tài liệu chuẩn hóa của bạn.</p>
            </div>
        </div>

        <div className="mt-5">
            <Link href="/dashboard/courses" className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-[#00cec9] font-bold hover:underline">
            <span>Truy cập</span>
            <span className="transform group-hover:translate-x-1 transition-transform">→</span>
            </Link>
        </div>
        </div>

      <div className="p-6 bg-white rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow duration-200 flex flex-col justify-between">
        <div>
          <span className="text-xs font-bold text-[#2d3436]/50 uppercase tracking-wide">Không gian quan sát</span>
          <h4 className="text-lg font-bold text-[#2d3436] mt-1">Sơ đồ tư duy</h4>
          <p className="text-xs text-[#2d3436]/60 mt-1">Trực quan hóa mạng lưới kiến thức đã trích xuất từ tài liệu.</p>
        </div>
        
        <div className="my-4 flex items-center justify-center gap-2 bg-[#f7f9f8] p-3 rounded-xl border border-dashed border-slate-200">
          <div className="w-3 h-3 rounded-full bg-[#00cec9]"></div>
          <div className="h-0.5 w-8 bg-slate-300"></div>
          <div className="w-4 h-4 rounded-full bg-[#FF3399]"></div>
          <div className="h-0.5 w-6 bg-slate-300"></div>
          <div className="w-3 h-3 rounded-full bg-[#2d3436]"></div>
        </div>

        <Link href="/dashboard/courses/create/mindmap" className="text-xs text-[#2d3436] font-semibold hover:text-[#FF3399] transition-colors">
          Mở trình xem cây sơ đồ →
        </Link>
      </div>

      <div className="md:col-span-2 p-6 bg-[#2d3436] text-[#f7f9f8] rounded-2xl shadow-md flex flex-col justify-between group">
        <div>
          <div className="flex justify-between items-center">
            <h4 className="text-lg font-bold text-white group-hover:text-[#00cec9] transition-colors">Tra cứu tài liệu tri thức</h4>
            <span className="text-[11px] font-mono text-[#00cec9] bg-white/5 px-2 py-0.5 rounded border border-white/10">Search</span>
          </div>
          <p className="text-sm text-[#f7f9f8]/70 mt-1 max-w-xl">
            Tra cứu kiến thức từ nguồn tài liệu sẵn có của bạn
          </p>
        </div>

        <Link href="/dashboard/lookup" className="block mt-6">
            <div className="flex items-center gap-3 bg-white/5 border border-white/10 p-2 rounded-xl hover:border-[#00cec9] transition-colors cursor-pointer">
                <Search size={16} className="text-[#f7f9f8]/40 ml-2 shrink-0" />
                <span className="text-sm text-white/30 flex-1 select-none py-0.5">
                Nhập để chuyển đến tra cứu...
                </span>
                <span className="text-[10px] bg-white/10 text-white/60 px-1.5 py-0.5 rounded font-mono">
                Ask
                </span>
            </div>
        </Link>
      </div>
    </div>
  );
}