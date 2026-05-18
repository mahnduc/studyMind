import { Roboto_Mono } from "next/font/google";
import "./globals.css";

const robotoMono = Roboto_Mono({ 
  subsets: ["latin", "vietnamese"], 
  variable: "--font-roboto-mono" 
});

import type { Metadata } from "next";

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
          {children}
      </body>
    </html>
  );
}