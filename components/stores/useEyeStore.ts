import { create } from 'zustand'

type EyeState = {
  mouseX: number
  mouseY: number
  setMousePosition: (x: number, y: number) => void
}

export const useEyeStore = create<EyeState>((set) => ({
  mouseX: 0,
  mouseY: 0,
  setMousePosition: (x, y) => set({ mouseX: x, mouseY: y }),
}))