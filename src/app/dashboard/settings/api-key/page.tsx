"use client";

import { useState, useEffect, useCallback } from "react";
import { keyApi } from "./_api/key.api";
import { KeysSchema } from "./_services/key.service";
import { 
  Plus, 
  Trash2, 
  Key, 
  AlertCircle, 
  CheckCircle2,
  Cpu,
  ChevronDown,
  ShieldCheck
} from "lucide-react";

export default function ApiKeyTool() {
  const [provider, setProvider] = useState("groq");
  const [apiKey, setApiKey] = useState("");
  const [message, setMessage] = useState({ text: "", type: "" });
  const [allKeys, setAllKeys] = useState<KeysSchema>({});
  const [isLoading, setIsLoading] = useState(false);
  
  const fetchKeys = useCallback(async () => {
    const data = await keyApi.getAll();
    setAllKeys(data || {});
  }, []);

  useEffect(() => {
    fetchKeys();
  }, [fetchKeys]);

  const handleSave = async () => {
    if (!apiKey.trim()) {
      setMessage({ text: "Vui lòng nhập API Key", type: "error" });
      return;
    }
    setIsLoading(true);
    try {
      await keyApi.addKey(provider, apiKey);
      setMessage({ text: "Đã lưu mã bảo mật thành công!", type: "success" });
      setApiKey("");
      await fetchKeys();
    } catch (err: any) {
      setMessage({ text: err.message || "Lỗi hệ thống", type: "error" });
    } finally {
      setIsLoading(false);
      setTimeout(() => setMessage({ text: "", type: "" }), 3000);
    }
  };

  const handleRemove = async (prov: string, key: string) => {
    if (confirm(`Bạn có chắc chắn muốn xóa key cho ${prov.toUpperCase()}?`)) {
      await keyApi.removeKey(prov, key);
      await fetchKeys();
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-10 p-6 font-['Nunito'] text-[#2D3436] animate-in fade-in duration-500">
      
      {/* HEADER SECTION */}
      <header className="space-y-2">
        <h1 className="text-3xl font-[800] tracking-tight text-[#2D3436]">
          Quản lý API Keys
        </h1>
        <p className="text-[#B2BEC3] font-[600]">
          Lưu trữ và bảo mật các mã truy cập dịch vụ AI của bạn.
        </p>
      </header>

      {/* SECTION 1: ADD NEW KEY (Input Card Style) */}
      <section className="bg-white border-[2px] border-[#F0F0F0] rounded-[24px] p-8 shadow-[0_4px_0_0_#F0F0F0]">
        <div className="flex items-center gap-3 mb-8">
          <div className="p-3 bg-[#FFF0F7] rounded-xl text-[#FF3399]">
            <ShieldCheck size={24} />
          </div>
          <div>
            <h2 className="text-xl font-[700]">Cấu hình bảo mật</h2>
            <p className="text-sm text-[#B2BEC3] font-[600]">Thêm Token mã hóa mới vào hệ thống</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Service Provider Select */}
          <div className="space-y-2">
            <label className="text-sm font-[700] ml-1">Dịch vụ cung cấp</label>
            <div className="relative group">
              <select
                value={provider}
                onChange={(e) => setProvider(e.target.value)}
                className="w-full bg-[#F7F9FB] border-[2px] border-[#E0E0E0] rounded-[16px] px-4 py-3 text-[15px] font-[600] outline-none transition-all focus:border-[#FF3399] appearance-none"
              >
                <option value="groq">Groq</option>
              </select>
              <ChevronDown size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-[#B2BEC3] pointer-events-none group-focus-within:text-[#FF3399]" />
            </div>
          </div>

          {/* API Key Input */}
          <div className="space-y-2">
            <label className="text-sm font-[700] ml-1">Mã API Key (Entry Token)</label>
            <input 
              type="password" 
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="••••••••••••••••"
              className="w-full bg-[#F7F9FB] border-[2px] border-[#E0E0E0] rounded-[16px] px-4 py-3 text-[15px] outline-none transition-all focus:border-[#FF3399] placeholder:text-[#B2BEC3]"
            />
          </div>
        </div>

        <div className="mt-8 flex flex-col sm:flex-row items-center gap-4">
          <button 
            onClick={handleSave}
            disabled={isLoading}
            className={`
              relative w-full sm:w-auto px-8 py-3 rounded-[16px] font-[700] text-white uppercase tracking-wider transition-all active:translate-y-[2px] active:shadow-none
              ${isLoading ? 'bg-[#B2BEC3] shadow-[0_4px_0_0_#929EAD]' : 'bg-[#FF3399] shadow-[0_4px_0_0_#D12A7E] hover:brightness-105'}
            `}
          >
            {isLoading ? "Đang xử lý..." : "Cập nhật"}
          </button>

          {message.text && (
            <div className={`flex items-center gap-2 font-[700] text-sm px-4 py-2 rounded-pill animate-in fade-in zoom-in duration-300 ${
              message.type === "error" ? "text-[#FF3399]" : "text-[#00CEC9]"
            }`}>
              {message.type === "error" ? <AlertCircle size={18} /> : <CheckCircle2 size={18} />}
              {message.text}
            </div>
          )}
        </div>
      </section>

      {/* SECTION 2: STORED KEYS (Lesson Card Style) */}
      <section className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-[700] flex items-center gap-2">
            Danh sách khóa <span className="bg-[#00CEC9] text-white text-[11px] px-2 py-1 rounded-full">{Object.keys(allKeys).length}</span>
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Object.keys(allKeys).length === 0 ? (
            <div className="col-span-full border-[2px] border-dashed border-[#E0E0E0] rounded-[24px] p-12 text-center">
              <div className="bg-[#F7F9FB] w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 text-[#B2BEC3]">
                <Key size={32} />
              </div>
              <p className="text-[#B2BEC3] font-[600]">Chưa phát hiện mã khóa nào được lưu</p>
            </div>
          ) : (
            Object.entries(allKeys).map(([prov, keys]) => (
              <div key={prov} className="bg-white border-[2px] border-[#F0F0F0] rounded-[20px] overflow-hidden shadow-[0_2px_0_0_#F0F0F0] hover:border-[#FF3399]/30 transition-colors">
                <div className="px-5 py-4 bg-[#F7F9FB] border-b-[2px] border-[#F0F0F0] flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-white rounded-lg border-[1px] border-[#E0E0E0] flex items-center justify-center text-[#FF3399]">
                      <Cpu size={16} />
                    </div>
                    <span className="font-[800] uppercase text-[13px] tracking-wide">{prov}</span>
                  </div>
                  <span className="bg-[#E0E0E0] text-[#636E72] text-[10px] font-[800] px-2 py-1 rounded-lg uppercase">
                    {keys.length} Nodes
                  </span>
                </div>
                
                <div className="divide-y-[1.5px] divide-[#F0F0F0]">
                  {keys.map((k, i) => (
                    <div key={i} className="px-5 py-4 flex justify-between items-center group hover:bg-[#FFF0F7]/30 transition-colors">
                      <div className="flex items-center gap-3">
                        <Key size={14} className="text-[#B2BEC3]" />
                        <code className="text-[14px] font-[600] text-[#636E72] bg-[#F7F9FB] px-2 py-1 rounded-md border-[1px] border-[#E0E0E0]">
                          {k.slice(0, 8)}••••{k.slice(-4)}
                        </code>
                      </div>
                      <button 
                        onClick={() => handleRemove(prov, k)}
                        className="p-2 text-[#B2BEC3] hover:text-[#FF3399] hover:bg-[#FFF0F7] rounded-full transition-all"
                        title="Xóa khóa này"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
}