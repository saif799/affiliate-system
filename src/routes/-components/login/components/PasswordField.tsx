import { useState } from 'react'
import { EyeIcon } from '../../shared/EyeIcon'

interface PasswordFieldProps {
  value: string
  onChange: (v: string) => void
  disabled?: boolean
}

export function PasswordField({ value, onChange, disabled }: PasswordFieldProps) {
  const [show, setShow] = useState(false)

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
          كلمة المرور
        </label>
        <a
          href="/forgot-password"
          className="text-[11px] text-slate-600 hover:text-indigo-400 transition-colors"
        >
          نسيت كلمة المرور؟
        </a>
      </div>

      <div className="relative group">
        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-600 pointer-events-none transition-colors group-focus-within:text-indigo-400">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="11" width="18" height="11" rx="2"/>
            <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
          </svg>
        </span>

        <input
          type={show ? 'text' : 'password'}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="••••••••"
          disabled={disabled}
          className="w-full bg-white/4 border border-white/8 text-white dark-input placeholder-slate-700 rounded-xl py-2.5 text-sm pr-10 pl-10 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500/50 focus:bg-white/6 transition-all duration-200 disabled:opacity-40 caret-indigo-400"
        />

        <button
          type="button"
          tabIndex={-1}
          onClick={() => setShow((p) => !p)}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600 hover:text-slate-300 transition-colors"
        >
          <EyeIcon open={show} />
        </button>
      </div>
    </div>
  )
}