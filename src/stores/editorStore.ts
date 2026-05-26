import { create } from "zustand"

interface EditorStore {
  filePath: string | null
  setFilePath: (path: string | null) => void
}

export const useEditorStore = create<EditorStore>((set) => ({
  filePath: null,
  setFilePath: (path) => set({ filePath: path }),
}))