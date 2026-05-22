'use client';

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  GraduationCap, BookOpen, Settings,
  LayoutDashboard, BotMessageSquare,
  ChevronUp, ChevronDown,
  User,
  GitFork,
  Puzzle
} from "lucide-react";
import { Nunito } from 'next/font/google';
import { UserContext } from "@/context/UserContext";
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const nunito = Nunito({
  subsets: ['latin'],
  weight: ['400', '600', '700', '800', '900'],
  display: 'swap',
});

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  const [isHeaderVisible, setIsHeaderVisible] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [authorized, setAuthorized] = useState(false);
  const [userName, setUserName] = useState('USER NAME');

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const checkProfile = async () => {
      try {
        const root = await navigator.storage.getDirectory();

        let profileDir;
        try {
          profileDir = await root.getDirectoryHandle('system-profile');
        } catch {
          router.replace('/intro');
          return;
        }

        let fileHandle;
        try {
          fileHandle = await profileDir.getFileHandle('info.json');
          const file = await fileHandle.getFile();
          const text = await file.text();
          const data = JSON.parse(text);

          setUserName(data.username)
          setAuthorized(true);
        } catch {
          router.replace('/intro');
          return;
        }

      } catch (error) {
        console.error('OPFS profile check failed:', error);
        router.replace('/intro');
      }
    };

    if (mounted) {
      checkProfile();
    }
  }, [mounted, router]);

  const navItems = [
    { icon: LayoutDashboard, label: "Trang chủ", href: "/dashboard" },
    { icon: BookOpen, label: "Luyện tập", href: "/dashboard/courses" },
    { icon: BotMessageSquare, label: "Tra cứu", href: "/dashboard/chatbot" },
    { icon: GitFork, label: "Mindmap", href: "/dashboard/courses/create/mindmap" },
    { icon: Puzzle, label: "Bộ sưu tập", href: "/dashboard/collections"}
  ];

  if (!mounted || !authorized) {
    return <div className="bg-[#F7F9FB] h-screen w-full" />;
  }

  return (
    <div className={`flex h-screen w-full overflow-hidden bg-[#F7F9FB] text-[#2D3436] ${nunito.className}`}>

      {/* SIDEBAR */}
      <aside className="hidden lg:flex w-60 border-r border-[#F0F0F0] h-screen bg-white flex-col z-60 shrink-0 p-4">
        <div className="h-16 flex items-center px-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#FF3399] rounded-xl flex items-center justify-center shadow-[0_4px_0_#D12A7E]">
              <GraduationCap size={22} className="text-white" strokeWidth={2.5} />
            </div>
            <span className="font-black text-xl tracking-tight text-[#FF3399]">STUDYMIND</span>
          </div>
        </div>

        <nav className="flex flex-col space-y-2 w-full">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-4 px-4 h-11 rounded-xl font-bold transition-all
                  ${isActive
                    ? "bg-[#FFF0F7] text-[#FF3399] border-l-[3px] border-[#FF3399]"
                    : "text-[#2D3436] hover:bg-[#F7F9FB]"}`}
              >
                <item.icon size={20} strokeWidth={isActive ? 3 : 2.5} className={isActive ? "text-[#FF3399]" : "text-[#B2BEC3]"} />
                <span className="text-[15px]">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto pt-4 border-t border-[#F0F0F0]">
          <Link href="/dashboard/settings"
            className={`flex items-center gap-4 px-4 h-11 rounded-xl font-bold transition-all ${
              pathname === '/dashboard/settings' ? "bg-[#2D3436] text-white" : "text-[#2D3436] hover:bg-[#F7F9FB]"
            }`}>
            <Settings size={20} strokeWidth={2.5} className={pathname === '/dashboard/settings' ? "text-white" : "text-[#B2BEC3]"} />
            <span className="text-[15px]">Cài đặt</span>
          </Link>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0 h-full relative overflow-hidden">

        {/* HEADER */}
        <header className={`h-16 border-b border-[#F0F0F0] bg-white flex justify-between items-center px-8 shrink-0 z-50 transition-all duration-300 ease-in-out ${
          isHeaderVisible ? "mt-0 opacity-100" : "-mt-16 opacity-0 pointer-events-none"
        }`}>
          <div className="flex items-center gap-4">
            <h1 className="text-sm font-extrabold tracking-wider text-[#2D3436] uppercase">
              XIN CHÀO, <span className="text-[#FF3399]">{userName}</span>
            </h1>
            <button
              onClick={() => setIsHeaderVisible(false)}
              className="p-1 hover:bg-[#F7F9FB] rounded-lg text-[#B2BEC3] transition-colors"
              title="Ẩn thanh tiêu đề"
            >
              <ChevronUp size={18} strokeWidth={3} />
            </button>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 bg-[#FFF4E0] px-3 py-1.5 rounded-full border-b-2 border-[#FFB800]">
              <Link href="/simple"><span className="text-orange-500 text-sm font-black cursor-pointer">Soạn thảo</span></Link>
            </div>
            <Link href="/dashboard/settings">
            <button className="h-10 w-10 rounded-full border-2 border-[#E5E5E5] overflow-hidden cursor-pointer">
              <div className="bg-[#B2BEC3] w-full h-full flex items-center justify-center text-white font-bold text-xs">
                <User size={18} strokeWidth={3} />
              </div>
            </button>
            </Link>
          </div>
        </header>

        {!isHeaderVisible && (
          <button
            onClick={() => setIsHeaderVisible(true)}
            className="absolute top-4 right-8 z-51 bg-white border-2 border-[#E5E5E5] border-b-4 p-2 rounded-2xl text-[#FF3399] shadow-lg hover:translate-y-0.5 hover:border-b-2 transition-all animate-bounce"
            title="Hiện thanh tiêu đề"
          >
            <ChevronDown size={20} strokeWidth={3} />
          </button>
        )}

        <UserContext.Provider value={{ userName }}>
          <main className="flex-1 overflow-y-auto bg-white scroll-smooth flex flex-col">
            <div className="w-full h-full flex-1">
              {children}
              <ToastContainer />
            </div>
          </main>
        </UserContext.Provider>
      </div>
    </div>
  );
}