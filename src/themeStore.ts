import { create } from 'zustand'

export const ACCENT_PRESETS = [
  '#22d3ee',
  '#7c6cff',
  '#34d399',
  '#f472b6',
  '#f59e0b',
  '#ef4444',
]

const STORAGE_KEY = 'synthstudio-theme-v1'

interface ThemeState {
  accent: string
  setAccent: (color: string) => void
}

function loadAccent(): string {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as { accent?: string }
      if (parsed.accent) return parsed.accent
    }
  } catch {
    // ignora estado corrompido
  }
  return '#22d3ee'
}

export const useTheme = create<ThemeState>()(set => ({
  accent: loadAccent(),
  setAccent: color => {
    set({ accent: color })
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ accent: color }))
    } catch {
      // ignora quota
    }
  },
}))
