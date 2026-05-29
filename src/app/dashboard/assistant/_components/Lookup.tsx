import { ArrowRight, Search } from "lucide-react";
import Link from "next/link";

export default function Lookup() {
    return (
        <div className="w-full bg-white border border-gray-100 rounded-3xl p-6 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 hover:border-indigo-100 transition-all duration-300 group">
            <div className="flex items-start gap-4 flex-1 min-w-0">
                <div className="bg-linear-to-br from-blue-500 to-indigo-500 text-white p-4 rounded-2xl shadow-md shrink-0">
                    <Search size={26} />
                </div>
                <div className="space-y-1.5 flex-1 min-w-0">
                    <span className="inline-block text-[10px] font-extrabold uppercase tracking-wider bg-blue-50 text-blue-600 px-2.5 py-1 rounded-md">
                        Hệ thống tra cứu
                    </span>
                    <h3 className="font-bold text-gray-800 text-lg">
                        Tra cứu tài liệu của bạn
                    </h3>
                    <p className="text-xs text-gray-400 font-medium">
                        Tìm kiếm ngữ nghĩa, truy vấn thông tin nhanh chóng từ nguồn dữ liệu đã được số hóa.
                    </p>
                </div>
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto shrink-0">
                <Link href="/dashboard/lookup" className="w-full sm:w-auto">
                    <button className="w-full sm:w-none px-6 py-3.5 bg-gray-900 hover:bg-indigo-600 text-white font-bold text-sm rounded-2xl shadow-sm hover:shadow-lg hover:shadow-indigo-600/10 transition-all duration-300 flex items-center justify-center gap-2 group/btn">
                        <span>Tra cứu</span>
                        <ArrowRight
                            size={16}
                            className="transition-transform duration-300 group-hover/btn:translate-x-1"
                        />
                    </button>
                </Link>
            </div>
        </div>
    )
}