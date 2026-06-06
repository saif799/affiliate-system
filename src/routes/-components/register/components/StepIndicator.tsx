import type { Step } from '../types/-register.types'

interface StepMeta {
  num: Step
  label: string
}

const stepMeta: StepMeta[] = [
  { num: 1, label: 'نوع الحساب' },
  { num: 2, label: 'معلوماتك' },
  { num: 3, label: 'كلمة المرور' },
]

export function StepIndicator({ step }: { step: Step }) {
  return (
    <div className="flex items-center mb-5">
      {stepMeta.map((s, i) => (
        <div
          key={s.num}
          className="flex items-center"
          style={{ flex: i < stepMeta.length - 1 ? 1 : 'none' }}
        >
          <div
            className={`flex items-center gap-1.5 transition-all duration-300 ${
              step === s.num ? 'opacity-100' : step > s.num ? 'opacity-70' : 'opacity-25'
            }`}
          >
            <div
              className={`
                w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 transition-all duration-300
                ${step > s.num
                  ? 'bg-indigo-500 text-white'
                  : step === s.num
                    ? 'bg-indigo-500/20 border border-indigo-500/60 text-indigo-400'
                    : 'bg-white/5 border border-white/10 text-slate-600'
                }
              `}
            >
              {step > s.num ? (
                <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
              ) : (
                s.num
              )}
            </div>
            <span
              className={`text-[11px] whitespace-nowrap font-medium ${
                step === s.num ? 'text-slate-300' : 'text-slate-600'
              }`}
            >
              {s.label}
            </span>
          </div>

          {i < stepMeta.length - 1 && (
            <div
              className={`flex-1 h-px mx-2 transition-all duration-500 ${
                step > s.num ? 'bg-indigo-500/40' : 'bg-white/6'
              }`}
            />
          )}
        </div>
      ))}
    </div>
  )
}