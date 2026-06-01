import { create } from 'zustand';

// 1. Định nghĩa chi tiết cấu trúc log cho mỗi lần cộng XP
export interface XpLog {
  timestamp: string; // ISO String: "2026-05-31T09:30:00.000Z"
  amount: number;    // Số XP được cộng: 50
}

export interface UserProfile {
  username: string;
  updatedAt: string;
  totalXp: number;
  dailyXp: Record<string, XpLog[]>;
}

interface ProfileState {
  profile: UserProfile | null;
  isLoading: boolean;
  error: string | null;
  loadProfile: () => Promise<UserProfile | null>;
  updateProfile: (name: string) => Promise<boolean>;
  hasUsername: () => boolean;
  
  addXp: (amount: number) => Promise<boolean>;
  getLevel: () => number;
}

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
      
      if (parsedData.dailyXp) {
        for (const date in parsedData.dailyXp) {
          if (typeof parsedData.dailyXp[date] === 'number') {
            parsedData.dailyXp[date] = [{
              timestamp: new Date(date).toISOString(), 
              amount: parsedData.dailyXp[date]
            }];
          }
        }
      }

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

  addXp: async (amount: number) => {
    const currentProfile = get().profile;
    if (!currentProfile) return false;

    set({ isLoading: true, error: null });
    try {
      const today = new Date().toLocaleDateString('sv-SE'); 
      const nowIso = new Date().toISOString();

      const updatedTotalXp = currentProfile.totalXp + amount;
      
      const updatedDailyXp = { ...currentProfile.dailyXp };
      
      const currentDayLogs = Array.isArray(updatedDailyXp[today]) ? [...updatedDailyXp[today]] : [];

      currentDayLogs.push({
        timestamp: nowIso,
        amount: amount
      });
      
      updatedDailyXp[today] = currentDayLogs;

      const newProfileData: UserProfile = {
        ...currentProfile,
        totalXp: updatedTotalXp,
        dailyXp: updatedDailyXp,
        updatedAt: nowIso,
      };

      const root = await navigator.storage.getDirectory();
      const profileDir = await root.getDirectoryHandle("system-profile", { create: true });
      const fileHandle = await profileDir.getFileHandle("info.json", { create: true });
      const writable = await fileHandle.createWritable();

      await writable.write(JSON.stringify(newProfileData, null, 2));
      await writable.close();

      set({ profile: newProfileData });
      return true;
    } catch (err: any) {
      set({ error: err.message || "Không thể cập nhật XP vào OPFS" });
      return false;
    } finally {
      set({ isLoading: false });
    }
  },

  getLevel: () => {
    const totalXp = get().profile?.totalXp || 0;
    if (totalXp <= 0) return 1;
    return Math.floor(Math.sqrt(totalXp / 100)) + 1;
  }
}));