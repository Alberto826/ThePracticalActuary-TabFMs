import type { CSSProperties, ReactNode } from 'react'

export function SlideFrame({
  number: legacyNumber,
  kicker,
  tone,
  children,
  footer,
}: {
  number: string
  kicker: string
  tone: 'coral' | 'yellow' | 'mint' | 'cobalt'
  children: ReactNode
  footer?: ReactNode
}) {
  const palette = { coral: ['#d64e3b', '#fbe4dc'], yellow: ['#a36b13', '#f8edc9'], mint: ['#2f8175', '#dfeee7'], cobalt: ['#3869a8', '#e4edf8'] }[tone]
  const number = ({ '01': '02', '02': '04', '03': '05', '04': '06', '05': '07', '06': '01', '07': '08', '08': '03' } as Record<string, string>)[legacyNumber] ?? legacyNumber
  return <div className="mx-auto flex min-h-full w-full min-w-0 max-w-none flex-col px-5 py-8 lg:px-10 lg:py-12"><div className="flex items-center gap-3 font-mono text-[10px] uppercase tracking-[0.15em] text-[#74808a]"><span className="flex h-7 w-7 items-center justify-center rounded-full border text-[9px] font-semibold" style={{ borderColor: palette[0], color: palette[0] }}>{number}</span><span>{kicker}</span><span className="h-px w-12 bg-[#1e2a35]/15" /></div><div className="mt-7 min-w-0 flex-1">{children}</div>{footer && <div className="min-w-0">{footer}</div>}</div>
}

export function Slider({ label, value, min, max, step, onChange, suffix, hint }: { label: string; value: number; min: number; max: number; step: number; onChange: (value: number) => void; suffix: string; hint?: string }) {
  const progress = max === min ? 0 : Math.min(100, Math.max(0, ((value - min) / (max - min)) * 100))
  return <label className="block"><span className="flex items-center justify-between gap-3 text-xs font-semibold text-[#53606a]"><span>{label}</span><output className="font-mono text-[10px] text-[#1e2a35]">{suffix}</output></span><input aria-label={label} className="range-input mt-3 w-full" style={{ '--range-progress': `${progress}%` } as CSSProperties} type="range" min={min} max={max} step={step} value={value} onChange={(event) => onChange(Number(event.target.value))} /><span className="mt-2 block text-[10px] leading-4 text-[#8a9295]">{hint}</span></label>
}

export const formatPercent = (value: number) => `${Math.round(value * 100)}%`
export const formatMoney = (value: number) => `$${Math.round(value).toLocaleString('en-US')}`