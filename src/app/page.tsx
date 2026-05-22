'use client';

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, Variants } from "framer-motion";
import { Cloud } from "lucide-react";

interface UserProfile {
  username: string;
  updatedAt: string;
}

export default function LandingPage() {
  const [username, setUsername] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const checkUserProfile = async () => {
      try {
        const root = await navigator.storage.getDirectory();
        const profileDir = await root.getDirectoryHandle("system-profile", { create: false });
        const fileHandle = await profileDir.getFileHandle("info.json", { create: false });
        
        const file = await fileHandle.getFile();
        const text = await file.text();
        const data: UserProfile = JSON.parse(text);

        if (data && data.username) {
          setUsername(data.username);
          setIsLoading(false);
        } else {
          router.replace("/intro");
        }
      } catch (error) {
        router.replace("/intro");
      }
    };

    checkUserProfile();
  }, [router]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Enter" && !isLoading && username) {
        router.replace("/dashboard");
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isLoading, username, router]);

  const handleScreenClick = () => {
    if (!isLoading && username) {
      router.replace("/dashboard");
    }
  };

  const containerVariants: Variants = {
    initial: { opacity: 0, scale: 0.98 },
    animate: {
      opacity: 1,
      scale: 1,
      transition: {
        duration: 0.5,
        ease: [0.23, 1, 0.32, 1],
        staggerChildren: 0.15
      }
    }
  };

  const itemVariants: Variants = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 }
  };

  const cloudVariants = (duration: number, delay: number, range: number): Variants => ({
    floating: {
      x: [0, range, 0],
      y: [0, -10, 0],
      transition: {
        duration,
        repeat: Infinity,
        ease: "easeInOut",
        delay,
      },
    },
  });

  if (isLoading) {
    return <div className="min-h-screen w-full bg-[#F7F9FB]" />;
  }

  return (
    <main 
      onClick={handleScreenClick}
      className="min-h-screen w-full bg-[#F7F9FB] font-['Nunito'] flex flex-col items-center justify-center p-4 relative overflow-hidden cursor-pointer select-none"
    >
      <div className="absolute top-[-10%] left-[-10%] w-[40vw] h-[40vw] bg-[#00CEC9] opacity-10 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40vw] h-[40vw] bg-[#FF3399] opacity-5 rounded-full blur-[100px] pointer-events-none" />

      <motion.div variants={cloudVariants(8, 0, 40)} animate="floating" className="absolute top-[15%] left-[10%] text-[#00CEC9] opacity-20 pointer-events-none">
        <Cloud size={120} />
      </motion.div>
      <motion.div variants={cloudVariants(10, 1, -30)} animate="floating" className="absolute top-[25%] right-[15%] text-[#FF3399] opacity-10 pointer-events-none">
        <Cloud size={80} />
      </motion.div>
      <motion.div variants={cloudVariants(12, 0.5, 25)} animate="floating" className="absolute bottom-[20%] left-[15%] text-[#FF3399] opacity-10 pointer-events-none">
        <Cloud size={100} />
      </motion.div>
      <motion.div variants={cloudVariants(9, 2, -50)} animate="floating" className="absolute bottom-[10%] right-[10%] text-[#00CEC9] opacity-20 pointer-events-none">
        <Cloud size={150} />
      </motion.div>

      <motion.div 
        variants={containerVariants}
        initial="initial"
        animate="animate"
        className="z-10 text-center max-w-3xl pointer-events-none"
      >
        <motion.h1 
          variants={itemVariants} 
          className="text-[32px] sm:text-[40px] md:text-[64px] font-bold text-[#00CEC9] leading-[1.2] mb-12 tracking-tight block"
        >
          <span className="inline-block xl:whitespace-nowrap">Chào mừng quay trở lại</span>
          <span className="text-[#FF3399] uppercase tracking-tighter block mt-3 text-[44px] sm:text-[52px] md:text-[64px]">
            {username}!
          </span>
        </motion.h1>
      </motion.div>
    </main>
  );
}