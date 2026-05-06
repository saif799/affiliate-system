interface FieldProps {
  label: string
  type?: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
  disabled?: boolean
  icon?: React.ReactNode
  suffix?: React.ReactNode
  autoFocus?: boolean
}

export function Field({
  label,
  type = 'text',
  value,
  onChange,
  placeholder,
  disabled,
  icon,
  suffix,
  autoFocus,
}: FieldProps) {
  return (
    <div className="space-y-1.5">
      <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
        {label}
      </label>
      <div className="relative group">
        {icon && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-600 pointer-events-none transition-colors group-focus-within:text-indigo-400">
            {icon}
          </span>
        )}
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          disabled={disabled}
          autoFocus={autoFocus}
          className={`
            w-full bg-white/8 border border-white/8 text-white dark-input
            placeholder-slate-700 rounded-xl py-2.5 text-sm
            focus:outline-none focus:ring-2 focus:ring-indigo-500/40
            focus:border-indigo-500/50 focus:bg-white/6
            transition-all duration-200 disabled:opacity-40
            caret-indigo-400
            ${icon   ? 'pr-10' : 'pr-3.5'}
            ${suffix ? 'pl-10' : 'pl-3.5'}
          `}
        />
        {suffix && (
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600 transition-colors group-focus-within:text-slate-400">
            {suffix}
          </span>
        )}
      </div>
    </div>
  )
}