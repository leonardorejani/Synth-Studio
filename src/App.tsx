import { useEffect } from 'react'
import SynthApp from './synth'
import { useTheme, ACCENT_PRESETS } from './themeStore'

export default function App() {
  const accent = useTheme(s => s.accent)
  const setAccent = useTheme(s => s.setAccent)

  useEffect(() => {
    document.documentElement.style.setProperty('--accent', accent)
  }, [accent])

  return (
    <div className="flex h-full w-full flex-col">
      <header className="flex h-12 shrink-0 items-center gap-3 border-b border-white/10 bg-[#070811]/80 px-4">
        <div
          className="flex h-7 w-7 items-center justify-center rounded-lg text-sm font-bold text-white"
          style={{ background: 'linear-gradient(135deg, var(--accent), #7c6cff)' }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
            <path d="M5 6v12M10 6v12M15 6v12M19.5 6v12" stroke="white" strokeWidth="2.4" strokeLinecap="round" />
          </svg>
        </div>
        <h1 className="text-sm font-semibold text-white/90">
          Synth Studio
          <span className="ml-2 rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] font-normal text-white/50">
            v1.0.0
          </span>
        </h1>

        <div className="ml-auto flex items-center gap-2">
          <span className="text-[10px] text-white/35">Tema</span>
          {ACCENT_PRESETS.map(color => (
            <button
              key={color}
              className={`h-4 w-4 rounded-full transition-transform hover:scale-125 ${
                accent === color ? 'ring-2 ring-white/70 ring-offset-2 ring-offset-[#070811]' : ''
              }`}
              style={{ background: color }}
              onClick={() => setAccent(color)}
              title={color}
            />
          ))}
          <a
            className="ml-2 text-xs text-white/40 transition-colors hover:text-white/80"
            href="https://github.com/leonardorejani/Synth-Studio"
            target="_blank"
            rel="noreferrer"
            title="Ver no GitHub"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
              <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27s1.36.09 2 .27c1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0 0 16 8c0-4.42-3.58-8-8-8z" />
            </svg>
          </a>
        </div>
      </header>

      <main className="min-h-0 flex-1">
        <SynthApp windowId="standalone" />
      </main>
    </div>
  )
}
