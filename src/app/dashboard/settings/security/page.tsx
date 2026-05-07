"use client";

import React, { useState, useRef } from "react";

export default function SecuritySettings() {
  const [isPinEnabled, setIsPinEnabled] = useState(false);
  const [pin, setPin] = useState(["", "", "", "", "", ""]);
  const [isClearing, setIsClearing] = useState(false); // Trạng thái khi đang xóa
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // --- HÀM XỬ LÝ XÓA SẠCH DỮ LIỆU ---
  const handleClearAllData = async () => {
    const confirmClear = window.confirm(
      "Bạn có chắc chắn muốn xóa toàn bộ dữ liệu? Hành động này sẽ xóa sạch lịch sử chat, tệp tin và cài đặt cá nhân."
    );

    if (!confirmClear) return;

    setIsClearing(true);
    try {
      // 1. Xóa LocalStorage & SessionStorage
      localStorage.clear();
      sessionStorage.clear();

      // 2. Xóa Cookies
      const cookies = document.cookie.split(";");
      for (let i = 0; i < cookies.length; i++) {
        const cookie = cookies[i];
        const eqPos = cookie.indexOf("=");
        const name = eqPos > -1 ? cookie.substr(0, eqPos) : cookie;
        document.cookie = name + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/";
      }

      // 3. Xóa IndexedDB (Liệt kê các DB bạn đã tạo ở đây)
      // Ví dụ app bạn dùng database tên 'ChatDB'
      const databases = ['ChatDB', 'UserConfig']; 
      databases.forEach(db => window.indexedDB.deleteDatabase(db));

      // 4. Xóa OPFS (Origin Private File System)
      if (navigator.storage && navigator.storage.getDirectory) {
        const root = await navigator.storage.getDirectory();
        // @ts-ignore
        for await (const [name] of root.entries()) {
          await root.removeEntry(name, { recursive: true });
        }
      }

      alert("Đã xóa sạch toàn bộ dữ liệu thành công!");
      window.location.reload(); // Tải lại trang để áp dụng trạng thái mới
    } catch (error) {
      console.error("Lỗi khi xóa dữ liệu:", error);
      alert("Có lỗi xảy ra trong quá trình xóa dữ liệu.");
    } finally {
      setIsClearing(false);
    }
  };

  // Xử lý nhập PIN (giữ nguyên logic của bạn)
  const handlePinChange = (value: string, index: number) => {
    if (isNaN(Number(value))) return;
    const newPin = [...pin];
    newPin[index] = value.substring(value.length - 1);
    setPin(newPin);
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent, index: number) => {
    if (e.key === "Backspace" && !pin[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 p-4 font-['Nunito'] animate-in fade-in duration-500">
      
      {/* SECTION: BẬT/TẮT MÃ PIN */}
      <section className="bg-white border-2 border-[#F0F0F0] rounded-[24px] p-6 shadow-[0_4px_0_0_rgba(0,0,0,0.05)]">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h2 className="text-[20px] font-bold text-[#2D3436]">Xác thực mã PIN</h2>
            <p className="text-[15px] text-[#B2BEC3]">
              Yêu cầu người dùng nhập mã Pin gồm 6 số khi mở ứng dụng.
            </p>
          </div>
          <button 
            onClick={() => setIsPinEnabled(!isPinEnabled)}
            className={`w-14 h-8 rounded-full transition-colors relative ${isPinEnabled ? 'bg-[#00CEC9]' : 'bg-[#E8ECF0]'}`}
          >
            <div className={`absolute top-1 left-1 bg-white w-6 h-6 rounded-full transition-transform shadow-sm ${isPinEnabled ? 'translate-x-6' : 'translate-x-0'}`} />
          </button>
        </div>
      </section>

      {/* PIN INPUT SECTION */}
      {isPinEnabled && (
        <section className="bg-white border-2 border-[#F0F0F0] rounded-[24px] p-8 shadow-[0_4px_0_0_rgba(0,0,0,0.05)] text-center space-y-6 animate-in zoom-in-95 duration-300">
          <div className="space-y-2">
            <h3 className="text-[18px] font-bold text-[#2D3436]">Tạo mã PIN an toàn</h3>
            <p className="text-sm text-[#B2BEC3]">Nhập 6 số bí mật</p>
          </div>

          <div className="flex justify-center gap-3">
            {pin.map((digit, index) => (
              <input
                key={index}
                ref={(el) => { inputRefs.current[index] = el; }}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handlePinChange(e.target.value, index)}
                onKeyDown={(e) => handleKeyDown(e, index)}
                className="w-12 h-14 text-2xl font-bold text-center border-2 border-[#E8ECF0] rounded-[12px] focus:border-[#FF3399] focus:outline-none transition-all text-[#2D3436]"
              />
            ))}
          </div>

          <div className="pt-4 flex flex-col gap-3">
            <button className="w-full h-[52px] bg-[#FF3399] border-b-4 border-[#D12A7E] active:border-b-0 active:translate-y-[2px] rounded-[16px] text-white font-bold text-[17px] transition-all">
              XÁC NHẬN
            </button>
            <button 
              onClick={() => { setPin(["","","","","",""]); inputRefs.current[0]?.focus(); }}
              className="text-[#FF3399] font-bold text-sm hover:opacity-80 transition-opacity"
            >
              Xóa tất cả
            </button>
          </div>
        </section>
      )}

      {/* SECTION: XÓA DỮ LIỆU (MỚI THÊM) */}
      <section className="bg-white border-2 border-[#FFEAA7] rounded-[24px] p-6 shadow-[0_4px_0_0_rgba(255,234,167,0.4)]">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <h2 className="text-[20px] font-bold text-[#D63031]">Dữ liệu & Quyền riêng tư</h2>
            <p className="text-[15px] text-[#B2BEC3]">
              Xóa toàn bộ file lưu trữ (OPFS), lịch sử chat và bộ nhớ tạm.
            </p>
          </div>
          
          <button 
            onClick={handleClearAllData}
            disabled={isClearing}
            className={`px-6 h-[52px] rounded-[16px] font-bold text-white transition-all 
              ${isClearing 
                ? 'bg-[#B2BEC3] cursor-not-allowed' 
                : 'bg-[#FF7675] border-b-4 border-[#D63031] active:border-b-0 active:translate-y-[2px] hover:brightness-110'
              }`}
          >
            {isClearing ? "ĐANG XÓA..." : "XÓA DỮ LIỆU"}
          </button>
        </div>
      </section>

    </div>
  );
}