import { GraduationCap, Settings } from "lucide-react";
import { navItems } from "../dashboard-items";
import Link from "next/link";

interface DashboardSidebarProps {
  pathname: string;
}

export default function DashboardSidebar({pathname}: DashboardSidebarProps) {
    return (
        <>
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
        </>
    )
}