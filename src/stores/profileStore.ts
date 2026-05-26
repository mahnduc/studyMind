import { create } from 'zustand';

// 1. Định nghĩa cấu trúc dữ liệu mới cho Profile
export interface UserProfile {
  username: string;
  updatedAt: string;
  totalXp: number;
  dailyXp: Record<string, number>; // Định dạng: { "2026-05-22": 120, "2026-05-23": 50 }
}

interface ProfileState {
  profile: UserProfile | null;
  isLoading: boolean;
  error: string | null;
  loadProfile: () => Promise<UserProfile | null>;
  updateProfile: (name: string) => Promise<boolean>;
  hasUsername: () => boolean;
  
  // Các hàm bổ sung cho tính năng XP
  addXp: (amount: number) => Promise<boolean>;
  getLevel: () => number;
}

// Giá trị khởi tạo mặc định khi tạo mới profile
const DEFAULT_XP_DATA = {
  totalXp: 0,
  dailyXp: {},
};

export const useProfileStore = create<ProfileState>((set, get) => ({
  profile: null,
  isLoading: false,
  error: null,

  loadProfile: async () => {
    if (get().profile) return get().profile;

    set({ isLoading: true, error: null });
    try {
      const root = await navigator.storage.getDirectory();
      const profileDir = await root.getDirectoryHandle("system-profile", { create: true });
      
      const fileHandle = await profileDir.getFileHandle("info.json", { create: false });
      const file = await fileHandle.getFile();
      const text = await file.text();
      
      if (!text.trim()) {
        throw new Error("File rỗng");
      }

      const parsedData = JSON.parse(text);
      
      // Đảm bảo nếu file cũ chưa có trường XP, hệ thống tự bù giá trị mặc định thay vì trả về undefined
      const profileData: UserProfile = {
        ...DEFAULT_XP_DATA,
        ...parsedData
      };

      set({ profile: profileData });
      return profileData;
    } catch (err: any) {
      set({ profile: null });
      return null;
    } finally {
      set({ isLoading: false });
    }
  },

  updateProfile: async (name: string) => {
    if (!name.trim()) return false;
    
    set({ isLoading: true, error: null });
    try {
      const root = await navigator.storage.getDirectory();
      const profileDir = await root.getDirectoryHandle("system-profile", { create: true });
      const fileHandle = await profileDir.getFileHandle("info.json", { create: true });

      const writable = await fileHandle.createWritable();
      
      // Giữ lại dữ liệu XP cũ nếu đang thực hiện cập nhật tên, ngược lại lấy mặc định = 0
      const currentProfile = get().profile;
      const newProfileData: UserProfile = {
        username: name.trim(),
        updatedAt: new Date().toISOString(),
        totalXp: currentProfile?.totalXp ?? DEFAULT_XP_DATA.totalXp,
        dailyXp: currentProfile?.dailyXp ?? DEFAULT_XP_DATA.dailyXp,
      };

      await writable.write(JSON.stringify(newProfileData, null, 2));
      await writable.close();

      set({ profile: newProfileData });
      return true;
    } catch (err: any) {
      set({ error: err.message || "Không thể ghi file vào OPFS" });
      return false;
    } finally {
      set({ isLoading: false });
    }
  },

  hasUsername: () => {
    return !!get().profile?.username?.trim();
  },

  /**
   * HÀM CẬP NHẬT XP THEO NGÀY
   * @param amount Số lượng XP cộng thêm (ví dụ: 10, 20)
   */
  addXp: async (amount: number) => {
    const currentProfile = get().profile;
    // Nếu chưa load profile thành công, không cho phép cộng XP
    if (!currentProfile) return false;

    set({ isLoading: true, error: null });
    try {
      // 1. Lấy ngày hiện tại ở múi giờ địa phương (định dạng YYYY-MM-DD)
      const today = new Date().toLocaleDateString('sv-SE'); // 'sv-SE' trả về định dạng YYYY-MM-DD trực tiếp

      // 2. Tính toán lượng XP mới
      const updatedTotalXp = currentProfile.totalXp + amount;
      const updatedDailyXp = { ...currentProfile.dailyXp };
      updatedDailyXp[today] = (updatedDailyXp[today] || 0) + amount;

      const newProfileData: UserProfile = {
        ...currentProfile,
        totalXp: updatedTotalXp,
        dailyXp: updatedDailyXp,
        updatedAt: new Date().toISOString(),
      };

      // 3. Ghi trực tiếp vào file info.json của OPFS
      const root = await navigator.storage.getDirectory();
      const profileDir = await root.getDirectoryHandle("system-profile", { create: true });
      const fileHandle = await profileDir.getFileHandle("info.json", { create: true });
      const writable = await fileHandle.createWritable();

      await writable.write(JSON.stringify(newProfileData, null, 2));
      await writable.close();

      // 4. Cập nhật ngược lại Zustand State để các UI lắng nghe cập nhật ngay lập tức
      set({ profile: newProfileData });
      return true;
    } catch (err: any) {
      set({ error: err.message || "Không thể cập nhật XP vào OPFS" });
      return false;
    } finally {
      set({ isLoading: false });
    }
  },

  /**
   * HÀM TÍNH TOÁN ĐỘNG LEVEL HIỆN TẠI
   * Công thức lũy tiến: Level = căn_bậc_hai(Tổng_XP / 100) + 1
   */
  getLevel: () => {
    const totalXp = get().profile?.totalXp || 0;
    if (totalXp <= 0) return 1;
    return Math.floor(Math.sqrt(totalXp / 100)) + 1;
  }
}));

// Hướng dẫn sử dụng cộng xp
// export default function ActionButton() {
//   const addXp = useProfileStore((state) => state.addXp);

//   const handleCompleteTask = async () => {
//     // Thực hiện logic của bạn...
    
//     // Cộng 50 XP cho người dùng vì đã hoàn thành nhiệm vụ
//     const success = await addXp(50);
//     if (success) {
//       console.log("Chúc mừng! Bạn đã nhận được 50 XP.");
//     }
//   };

//   return <button onClick={handleCompleteTask}>Hoàn thành nhiệm vụ</button>;
// }