"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence, Variants } from "framer-motion";
import { ArrowRight, Cloud, Rocket } from "lucide-react";
import { useRouter } from "next/navigation"; 

export default function JourneyIntro() {
  const [step, setStep] = useState(0);
  const [name, setName] = useState("");
  const [isSaving, setIsSaving] = useState(false); 
  const router = useRouter();

  // Xử lý phím Enter toàn cục (vẫn giữ cho người dùng máy tính)
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Enter") {
        if (step === 1 && name.trim()) {
          setStep(2);
        } else if (step === 2) {
          handleFinishJourney();
        }
      }
    };
    window.addEventListener("keydown", handleGlobalKeyDown);
    return () => window.removeEventListener("keydown", handleGlobalKeyDown);
  }, [step, name, isSaving]);

  // Hàm xử lý lưu OPFS và chuyển trang
  const handleFinishJourney = async () => {
    if (isSaving || !name.trim()) return;
    setIsSaving(true);

    try {
      // 1. TRUY CẬP HỆ THỐNG FILE OPFS
      const root = await navigator.storage.getDirectory();
      const profileDir = await root.getDirectoryHandle("system-profile", { create: true });
      const fileHandle = await profileDir.getFileHandle("info.json", { create: true });

      // 2. GHI DỮ LIỆU
      const writable = await fileHandle.createWritable();
      const userData = {
        username: name,
        updatedAt: new Date().toISOString(),
      };

      await writable.write(JSON.stringify(userData, null, 2));
      await writable.close();

      router.replace("/dashboard");

    } catch (error) {
        router.replace("/dashboard");
    } finally {
      setIsSaving(false);
    }
  };

  const pageVariants: Variants = {
    initial: { opacity: 0, x: 20, scale: 0.98 },
    animate: { 
      opacity: 1, 
      x: 0, 
      scale: 1,
      transition: {
        duration: 0.4,
        ease: [0.23, 1, 0.32, 1], 
        when: "beforeChildren",
        staggerChildren: 0.1 
      }
    },
    exit: { 
      opacity: 0, 
      x: -20, 
      scale: 0.98,
      transition: { duration: 0.3 }
    },
  };

  const itemVariants: Variants = {
    initial: { opacity: 0, y: 15 },
    animate: { opacity: 1, y: 0 },
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

  return (
    <main className="min-h-screen w-full bg-[#F7F9FB] font-['Nunito'] flex items-center justify-center p-4 relative overflow-hidden">
      
      {/* Background Decor */}
      <div className="absolute top-[-10%] left-[-10%] w-[40vw] h-[40vw] bg-[#00CEC9] opacity-10 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40vw] h-[40vw] bg-[#FF3399] opacity-5 rounded-full blur-[100px] pointer-events-none" />

      {/* Clouds */}
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

      <div className="z-10 w-full max-w-xl">
        <AnimatePresence mode="wait" initial={false}>
          
          {/* STEP 0: KHỞI ĐẦU */}
          {step === 0 && (
            <motion.div key="step0" variants={pageVariants} initial="initial" animate="animate" exit="exit" className="text-center">
              <motion.h1 variants={itemVariants} className="text-[40px] md:text-[56px] font-[900] text-[#00CEC9] leading-[1.1] mb-6 tracking-tight">
                HÀNH TRÌNH MỚI.
              </motion.h1>
              <motion.p variants={itemVariants} className="text-[#2D3436] text-[18px] font-[700] mb-12 opacity-70">
                Cùng đồng hành với chúng tôi.
              </motion.p>
              <motion.button
                variants={itemVariants}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setStep(1)}
                className="px-12 py-5 bg-[#FF3399] text-white rounded-[24px] font-[900] text-[22px] border-b-[6px] border-[#D12A7E] active:border-b-0 active:translate-y-[4px] transition-all shadow-xl shadow-[#FF3399]/30 uppercase tracking-wider"
              >
                Bắt đầu
              </motion.button>
            </motion.div>
          )}

          {/* STEP 1: NHẬP TÊN */}
          {step === 1 && (
            <motion.div key="step1" variants={pageVariants} initial="initial" animate="animate" exit="exit" className="w-full flex flex-col items-center">
              <motion.h2 variants={itemVariants} className="text-[32px] font-[900] text-[#00CEC9] mb-10 text-center leading-tight">
                Chúng tôi có thể gọi bạn là gì?
              </motion.h2>
              
              <motion.div variants={itemVariants} className="w-full relative group mb-12">
                <input
                  autoFocus
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Nhập tên..."
                  className="w-full bg-white border-[4px] border-[#00CEC9]/20 focus:border-[#FF3399] rounded-[32px] px-10 py-8 text-[28px] font-[800] text-[#00CEC9] outline-none shadow-2xl transition-all placeholder:text-[#B2BEC3]/40 text-center"
                />
                
                {/* Hướng dẫn trên Desktop */}
                <div className="hidden md:block">
                  <AnimatePresence>
                    {name.trim() && (
                      <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="absolute -bottom-10 left-1/2 -translate-x-1/2 text-[#FF3399] font-[800] text-[14px] uppercase tracking-widest whitespace-nowrap"
                      >
                        Nhấn Enter để tiếp tục
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>

              {/* Nút bấm dành riêng cho Mobile (và hiển thị tốt trên mọi thiết bị) */}
              <motion.div variants={itemVariants} className="w-full px-2">
                <AnimatePresence mode="wait">
                  {name.trim() && (
                    <motion.button
                      initial={{ opacity: 0, y: 20, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setStep(2)}
                      className="w-full py-6 bg-[#FF3399] text-white rounded-[28px] font-[900] text-[22px] border-b-[8px] border-[#D12A7E] active:border-b-0 active:translate-y-[6px] transition-all flex items-center justify-center gap-3 shadow-2xl shadow-[#FF3399]/30 uppercase tracking-wider"
                    >
                      Tiếp tục <ArrowRight size={26} strokeWidth={3} />
                    </motion.button>
                  )}
                </AnimatePresence>
              </motion.div>
            </motion.div>
          )}

          {/* STEP 2: HOÀN TẤT */}
          {step === 2 && (
            <motion.div key="step2" variants={pageVariants} initial="initial" animate="animate" exit="exit" className="text-center">
              <motion.h2 variants={itemVariants} className="text-[40px] md:text-[64px] font-[900] text-[#00CEC9] leading-tight mb-6">
                XIN CHÀO, <br/>
                <span className="text-[#FF3399] uppercase tracking-tighter whitespace-nowrap">{name}!</span>
              </motion.h2>

              <motion.p variants={itemVariants} className="text-[#2D3436] text-[20px] font-[700] max-w-sm mx-auto leading-relaxed mb-12 opacity-80">
                Bắt đầu chuyến phiêu lưu của bạn.
              </motion.p>

              <motion.div variants={itemVariants}>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  disabled={isSaving}
                  onClick={handleFinishJourney}
                  className={`w-full py-6 bg-[#00CEC9] text-white rounded-[28px] font-[900] text-[24px] border-b-[8px] border-[#00A8A3] active:border-b-0 active:translate-y-[6px] transition-all flex items-center justify-center gap-4 shadow-2xl shadow-[#00CEC9]/30 ${
                    isSaving ? "opacity-50 cursor-not-allowed" : ""
                  }`}
                >
                  {isSaving ? "ĐANG LƯU..." : <>BẮT ĐẦU HÀNH TRÌNH <ArrowRight size={28} strokeWidth={3} /></>}
                </motion.button>
              </motion.div>
            </motion.div>
          )}

        </AnimatePresence>
      </div>

      {/* Progress Bar */}
      <div className="absolute bottom-12 left-1/2 -translate-x-1/2 flex items-center gap-4 bg-white/50 p-2 rounded-full backdrop-blur-sm z-20">
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            initial={false}
            animate={{
              width: step === i ? 48 : 16,
              backgroundColor: step === i ? "#FF3399" : "rgba(0, 206, 201, 0.3)"
            }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="h-4 rounded-full"
          />
        ))}
      </div>
    </main>
  );
}