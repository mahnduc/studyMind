import { BookOpen, BotMessageSquare, Calendar, LayoutDashboard, LucideCompass, Puzzle } from "lucide-react";

export const navItems = [
    { icon: LayoutDashboard, label: "Trang chủ", href: "/dashboard" },
    { icon: LucideCompass, label: "Khám phá", href: "/dashboard/discover" },
    // { icon: BotMessageSquare, label: "Trợ lý", href: "/dashboard/assistant"},
    { icon: Puzzle, label: "Bộ sưu tập", href: "/dashboard/collections"},
    { icon: Calendar, label: "Thời gian biểu", href: "/dashboard/assistant/timetable"}
  ];