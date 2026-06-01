import { Roboto_Mono } from "next/font/google";
import "./globals.css";

const robotoMono = Roboto_Mono({ 
  subsets: ["latin", "vietnamese"], 
  variable: "--font-roboto-mono" 
});

import type { Metadata } from "next";
import EventEmitterInitializer from "@/components/EventEmitterInitializer";
import LearningCoachPopup from "@/components/LearningCoachPopup";
import FloatingChat from "@/components/floatingchat/FloatingChat";

export const metadata: Metadata = {
  title: "Uxie Platform",
  description: "Lofi web",
  icons: {
    icon: "/owl.png",
  },
};
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi" className={`${robotoMono.variable} dark`}>
      <body className="antialiased font-mono">
          <EventEmitterInitializer />
           <LearningCoachPopup />
           <FloatingChat />
          {children}
      </body>
    </html>
  );
}