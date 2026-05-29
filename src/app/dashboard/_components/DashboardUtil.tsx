import { BellRing, HardDrive, Puzzle } from "lucide-react";
import Link from "next/link";

export default function DashboardUtil() {
    return (
        <>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full">
            <Link href="/dashboard/collections" className="flex w-full">
                <button className="w-full min-h-14 bg-[#FF3399] text-white rounded-2xl flex items-center justify-center gap-3 font-black text-[14px] border-b-4 border-[#D12A7E] active:translate-y-0.5 active:border-b-0 transition-all shadow-sm cursor-pointer px-4 py-3">
                <Puzzle size={18} className="shrink-0" />
                <span className="uppercase tracking-tight truncate font-black">Bộ sưu tập</span>
                </button>
            </Link>

            <Link href="/dashboard/notification">
            <button className="w-full min-h-14 bg-white border-2 border-[#2D3436]/5 rounded-2xl flex items-center justify-center gap-3 border-b-4 border-[#E5E5E5] hover:bg-[#F7F9F8] active:translate-y-0.5 active:border-b-0 cursor-pointer transition-all group px-4 py-3">
                <BellRing size={18} className="text-[#FF3399] transition-transform group-hover:scale-110 shrink-0" />
                <div className="text-left min-w-0">
                <p className="text-[9px] font-black text-[#2D3436]/50 leading-none uppercase tracking-wider">Hệ thống</p>
                <p className="text-[13px] font-black text-[#2D3436] mt-0.5 truncate">Thông báo</p>
                </div>
            </button>
            </Link>

            <Link href="/dashboard/opfs-explorer" className="flex w-full">
                <div className="w-full min-h-14 bg-white border-2 border-[#2D3436]/5 rounded-2xl flex items-center justify-center gap-3 border-b-4 border-[#E5E5E5] hover:bg-[#F7F9F8] active:translate-y-0.5 active:border-b-0 cursor-pointer transition-all group px-4 py-3">
                <HardDrive size={18} className="text-[#00CEC9] transition-transform group-hover:scale-110 shrink-0" />
                <div className="text-left min-w-0">
                    <p className="text-[9px] font-black text-[#2D3436]/50 leading-none uppercase tracking-wider">Storage</p>
                    <p className="text-[13px] font-black text-[#2D3436] mt-0.5 truncate">OPFS Active</p>
                </div>
                </div>
            </Link>
            </div>
        </>
    )
}