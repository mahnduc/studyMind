'use client';

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ChevronUp, ChevronDown, User } from "lucide-react";
import { Nunito } from 'next/font/google';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useProfileStore } from "@/stores/profileStore";
import DashboardSidebar from "@/utils/ui/DashboardSidebar";

const nunito = Nunito({
  subsets: ['latin'],
  weight: ['400', '600', '700', '800', '900'],
  display: 'swap',
});

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  const profile = useProfileStore((state) => state.profile);
  const loadProfile = useProfileStore((state) => state.loadProfile);

  const [isHeaderVisible, setIsHeaderVisible] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const checkAuth = async () => {
      const currentProfile = await loadProfile();
      if (currentProfile && currentProfile.username?.trim()) {
        setAuthorized(true);
      } else {
        router.replace('/intro');
      }
    };

    if (mounted) {
      checkAuth();
    }
  }, [mounted, loadProfile, router]);
  if (!mounted || !authorized) {
    return <div className="bg-[#F7F9FB] h-screen w-full" />;
  }

  return (
    <div className={`flex h-screen w-full overflow-hidden bg-[#F7F9FB] text-[#2D3436] ${nunito.className}`}>
      <DashboardSidebar pathname={pathname} />
      <div className="flex-1 flex flex-col min-w-0 h-full relative overflow-hidden">
        {/* HEADER */}
        <header className={`h-16 border-b border-[#F0F0F0] bg-white flex justify-between items-center px-8 shrink-0 z-50 transition-all duration-300 ease-in-out ${
          isHeaderVisible ? "mt-0 opacity-100" : "-mt-16 opacity-0 pointer-events-none"
        }`}>
          <div className="flex items-center gap-4">
            <h1 className="text-sm font-extrabold tracking-wider text-[#2D3436] uppercase">
              XIN CHÀO, <span className="text-[#FF3399]">{profile?.username}</span>
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
            {/* <div className="flex items-center gap-2 bg-[#FFF4E0] px-3 py-1.5 rounded-full border-b-2 border-[#FFB800]">
              <Link href="/simple">
                <span className="text-orange-500 text-sm font-black cursor-pointer">Soạn thảo</span>
              </Link>
            </div> */}
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

        <main className="flex-1 overflow-y-auto bg-white scroll-smooth flex flex-col">
          <div className="w-full h-full flex-1">
            {children}
            <ToastContainer />
          </div>
        </main>
      </div>
    </div>
  );
}