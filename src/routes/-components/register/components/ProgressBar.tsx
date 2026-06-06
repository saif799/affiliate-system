import type { Step } from '../types/-register.types'

export function ProgressBar({ step }: { step: Step }) {
  const pct = ((step - 1) / 2) * 100
  return (
    <div className="w-full h-0.5 bg-white/6 rounded-full overflow-hidden">
      <div
        className="h-full bg-linear-to-r from-indigo-600 to-violet-500 rounded-full transition-all duration-700 ease-out"
        style={{ width: `${pct === 0 ? 6 : pct}%` }}
      />
    </div>
  )
}