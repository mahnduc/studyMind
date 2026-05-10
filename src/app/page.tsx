'use client';

import React from 'react';
import { motion, Variants } from "framer-motion";
import { 
  Search, 
  Compass, 
  Cpu, 
  ChevronRight,
  ArrowUpRight,
  Sparkles,
  Zap,
  Quote,
  QuoteIcon,
  Cloud,
  GraduationCap
} from 'lucide-react';
import Link from 'next/link';

export default function LandingPage() {
  const cloudVariants = (duration: number, delay: number, range: number): Variants => ({
    floating: {
      x: [0, range, 0],
      y: [0, -15, 0],
      transition: {
        duration,
        repeat: Infinity,
        ease: "easeInOut",
        delay,
      },
    },
  });

  return (
    <div className="min-h-screen bg-[#F7F9FB] font-['Nunito',sans-serif] text-[#2D3436] antialiased">

      <nav className="h-16 flex items-center justify-between px-8 md:px-16 bg-white border-b-2 border-[#E5E5E5] sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-[#FF3399] rounded-xl flex items-center justify-center border-b-4 border-[#D12A7E]">
             <span className="text-white font-black text-base">H</span>
          </div>
          <span className="text-[#2D3436] font-extrabold text-xl tracking-tight hidden sm:block">Hello World</span>
        </div>
        
        <div className="hidden md:flex gap-10 text-[13px] font-bold text-[#B2BEC3]">
          <a href="#" className="hover:text-[#FF3399] transition-colors uppercase tracking-widest">Tính năng</a>
          <a href="#" className="hover:text-[#FF3399] transition-colors uppercase tracking-widest">Mã nguồn</a>
          <a href="/docs/index.html" className="hover:text-[#FF3399] transition-colors uppercase tracking-widest">Tài liệu</a>
        </div>

        <Link href="/dashboard">
          <button className="bg-[#FF3399] text-white px-5 py-2 rounded-xl text-[13px] font-extrabold border-b-4 border-[#D12A7E] hover:brightness-105 active:border-b-0 active:translate-y-1 transition-all uppercase tracking-wider">
            Bắt đầu
          </button>
        </Link>
      </nav>

      <section className="max-w-275 mx-auto px-8 py-12 md:py-37 overflow-hidden">
        <div className="flex flex-col lg:flex-row items-center gap-12">
          
          <div className="lg:w-7/12 text-center lg:text-left z-10">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-[#2D3436] mb-6 leading-[1.1] tracking-tight">
              Kiến tạo tri thức <br /> 
              <span className="text-[#FF3399] relative inline-block">
                Nâng tầm tương lai
                <div className="absolute -bottom-1 left-0 w-full h-2 bg-[#00CEC9]/20 -z-10 rounded-full"></div>
              </span>
            </h1>
            
            <p className="max-w-lg text-[15px] lg:text-[16px] font-semibold text-[#B2BEC3] leading-relaxed mb-8 mx-auto lg:mx-0">
              Chúng tôi tin rằng học tập tốt nhất là khi được thiết kế riêng. Công cụ mã nguồn mở giúp bạn làm chủ hành trình tri thức của chính mình.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
              <Link href="/dashboard">
                <button className="h-12 px-8 bg-[#FF3399] text-white rounded-xl font-black text-xs uppercase tracking-widest border-b-4 border-[#D12A7E] hover:brightness-105 active:border-b-0 active:translate-y-1 transition-all flex items-center justify-center gap-2">
                  Học ngay bây giờ <ChevronRight size={18} strokeWidth={3} />
                </button>
              </Link>
              <button className="h-12 px-8 bg-white text-[#2D3436] rounded-xl font-black text-xs uppercase tracking-widest border-2 border-[#E5E5E5] border-b-4 hover:bg-[#F7F9FB] active:border-b-0 active:translate-y-1 transition-all">
                Xem mã nguồn
              </button>
            </div>
          </div>

          <div className="lg:w-5/12 w-full relative flex justify-center items-center min-h-75">
            <div className="absolute w-64 h-64 bg-[#00CEC9]/10 rounded-full blur-[80px] -z-10" />

            <motion.div 
              variants={cloudVariants(10, 0, 30)} 
              animate="floating" 
              className="text-[#00CEC9] opacity-30 drop-shadow-xl"
            >
              <Cloud size={180} fill="currentColor" />
            </motion.div>

            <motion.div 
              variants={cloudVariants(8, 1, -25)} 
              animate="floating" 
              className="absolute top-0 right-10 text-[#FF3399] opacity-20"
            >
              <Cloud size={90} fill="currentColor" />
            </motion.div>

            <motion.div 
              variants={cloudVariants(12, 0.5, 40)} 
              animate="floating" 
              className="absolute bottom-5 left-5 text-[#00CEC9] opacity-20"
            >
              <Cloud size={110} fill="currentColor" />
            </motion.div>

            <motion.div
              animate={{ 
                y: [0, -20, 0],
                rotate: [0, 10, 0]
              }}
              transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
              className="absolute z-20 bg-white p-4 rounded-2xl shadow-lg border-b-4 border-[#E5E5E5]"
            >
              <GraduationCap size={32} className="text-[#FF3399]" fill="#FF3399" />
            </motion.div>

          </div>
        </div>
      </section>

      <section className="bg-white border-y-2 border-[#E5E5E5] py-70">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <div className="relative inline-block">
            <Quote className="absolute -top-6 -left-8 text-[#00CEC9]/30" size={36} strokeWidth={2.5} />
            <h2 className="text-2xl md:text-4xl font-extrabold text-[#2D3436] leading-tight tracking-tight">
              Kiến thức thuộc về mọi người, <br />
              <span className="text-[#00CEC9]">học tập thuộc về từng cá nhân.</span>
            </h2>
            <Quote className="absolute -bottom-6 -right-8 rotate-180 text-[#00CEC9]/30" size={36} strokeWidth={2.5} />
          </div>
        </div>
      </section>

      <main className="max-w-275 mx-auto p-8 md:py-20">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          
          <div className="md:col-span-4 bg-[#2D3436] rounded-3xl p-6 border-b-[6px] border-black text-white flex flex-col justify-between min-h-70">
            <div>
              <p className="text-[10px] uppercase font-black tracking-[0.2em] text-[#00CEC9] mb-4">Philosophy</p>
              <h3 className="text-xl font-extrabold mb-4">Mã nguồn mở?</h3>
              <ul className="space-y-3 font-bold text-[#B2BEC3] text-[13px]">
                <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-[#00CEC9]"></div> Quyền sở hữu dữ liệu</li>
                <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-[#00CEC9]"></div> Không có phí ẩn</li>
                <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-[#00CEC9]"></div> Tùy chỉnh vô hạn</li>
              </ul>
            </div>
          </div>

          <div className="md:col-span-8 bg-white border-2 border-[#E5E5E5] border-b-[6px] rounded-3xl p-8 hover:border-[#FF3399] transition-all group cursor-pointer">
            <div className="h-12 w-12 bg-[#FFF0F7] rounded-xl flex items-center justify-center mb-6 border-b-2 border-[#FF3399]/20 group-hover:scale-110 transition-transform">
              <Search className="text-[#FF3399]" size={24} strokeWidth={3} />
            </div>
            <h3 className="text-xl font-extrabold text-[#2D3436] mb-3">Tra cứu ngữ nghĩa</h3>
            <p className="text-[#636E72] font-semibold leading-relaxed text-[15px]">
              Tìm kiếm sâu theo chủ đề thay vì chỉ dựa vào từ khóa. Hệ thống hiểu ngữ cảnh và tóm tắt kiến thức từ nguồn đáng tin cậy nhất của bạn.
            </p>
          </div>

          <div className="md:col-span-7 bg-white border-2 border-[#E5E5E5] border-b-[6px] rounded-3xl p-8 flex flex-col sm:flex-row gap-6 items-center">
            <div className="flex-1">
              <div className="inline-block px-2.5 py-0.5 bg-[#F0FFFE] border-2 border-[#00CEC9] rounded-lg mb-3">
                <span className="text-[10px] font-black text-[#00CEC9] uppercase tracking-wider italic">Smart Sync</span>
              </div>
              <h3 className="text-xl font-extrabold text-[#2D3436] mb-3">Theo dõi & Điều chỉnh</h3>
              <p className="text-[#636E72] font-semibold text-[14px]">
                Xác định điểm mạnh/yếu theo thời gian thực và đề xuất nội dung bổ sung phù hợp với bạn.
              </p>
            </div>
            <div className="w-full sm:w-40 flex items-end justify-between h-20 bg-[#F7F9FB] rounded-xl p-3 border-2 border-[#E5E5E5]">
              {[40, 70, 45, 90, 65, 80].map((h, i) => (
                <div key={i} className="w-3 bg-[#FF3399] rounded-t-full border-b-2 border-[#D12A7E]" style={{ height: `${h}%` }}></div>
              ))}
            </div>
          </div>

          <div className="md:col-span-5 bg-white border-2 border-[#E5E5E5] border-b-[6px] rounded-3xl p-8">
            <div className="h-12 w-12 bg-[#00CEC9]/10 rounded-xl flex items-center justify-center mb-5">
              <Compass className="text-[#00CEC9]" size={24} strokeWidth={3} />
            </div>
            <h3 className="text-lg font-extrabold text-[#2D3436] mb-2">Lộ trình cá nhân</h3>
            <p className="text-[#636E72] font-semibold text-[13px]">
              Tự động hóa danh sách bài học và tài liệu phù hợp nhất với trình độ hiện tại.
            </p>
          </div>

        </div>
      </main>

      <section className="max-w-275 mx-auto px-8 pb-20">
        <div className="bg-[#FF3399] rounded-4xl p-12 md:p-16 text-center relative overflow-hidden border-b-10 border-[#D12A7E]">
          <div className="absolute -top-10 -right-10 opacity-10 rotate-12">
            <Cpu size={240} className="text-white" />
          </div>
          
          <h2 className="text-3xl md:text-5xl font-black text-white mb-6 relative z-10 leading-tight">
            Sẵn sàng để làm chủ tri thức?
          </h2>
          
          <div className="flex justify-center relative z-10">
            <button className="h-14 px-10 bg-white text-[#FF3399] rounded-xl font-black text-xs uppercase tracking-widest border-b-4 border-[#E5E5E5] hover:brightness-110 active:border-b-0 active:translate-y-1 transition-all flex items-center gap-3">
              Ghé thăm GitHub <ArrowUpRight size={18} strokeWidth={3} />
            </button>
          </div>
        </div>
      </section>

      <footer className="py-12 text-center bg-white border-t-2 border-[#E5E5E5]">
        <p className="text-[10px] text-[#B2BEC3] font-black uppercase tracking-[0.3em]">
          © 2026
        </p>
      </footer>
    </div>
  );
}