import { useState } from 'react'
import type { Role } from '../types/register.types'
import { Field } from '../../shared/Field'
import { ErrorBox } from '../../shared/ErrorBox'
import { EyeIcon } from '../../shared/EyeIcon'
import { Spinner } from '../../shared/Spinner'

interface Step3Props {
  name: string
  email: string
  role: Role | null
  pwd: string
  conf: string
  errMsg: string
  isLoading: boolean
  onPwdChange: (v: string) => void
  onConfChange: (v: string) => void
  onBack: () => void
  onSubmit: (e: React.FormEvent) => void
}

function PasswordStrength({ pwd }: { pwd: string }) {
  if (!pwd.length) return null
  return (
    <div className="space-y-1.5 -mt-1">
      <div className="flex gap-1">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className={`flex-1 h-1 rounded-full transition-all duration-300 ${
              pwd.length >= i * 2
                ? pwd.length >= 8
                  ? 'bg-emerald-500'
                  : pwd.length >= 6
                    ? 'bg-amber-500'
                    : 'bg-red-500'
                : 'bg-white/6'
            }`}
          />
        ))}
      </div>
      <p
        className={`text-[11px] ${
          pwd.length >= 8 ? 'text-emerald-400' : pwd.length >= 6 ? 'text-amber-400' : 'text-red-400'
        }`}
      >
        {pwd.length >= 8 ? 'قوية ✓' : pwd.length >= 6 ? 'متوسطة' : 'ضعيفة'}
      </p>
    </div>
  )
}

function AccountSummary({ name, email, role }: { name: string; email: string; role: Role | null }) {
  const isMerchant = role === 'merchant'
  return (
    <div className="flex items-center gap-2.5 bg-white/3 rounded-xl px-3 py-2.5 border border-white/6">
      <div
        className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
          isMerchant
            ? 'bg-linear-to-br from-amber-500 to-orange-600'
            : 'bg-linear-to-br from-emerald-500 to-teal-600'
        }`}
      >
        {isMerchant ? (
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
            <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/>
            <line x1="3" y1="6" x2="21" y2="6"/>
            <path d="M16 10a4 4 0 0 1-8 0"/>
          </svg>
        ) : (
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
            <circle cx="18" cy="5" r="3"/>
            <circle cx="6" cy="12" r="3"/>
            <circle cx="18" cy="19" r="3"/>
            <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/>
            <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
          </svg>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-white text-[13px] font-medium truncate leading-tight">{name}</p>
        <p className="text-slate-500 text-[11px] truncate">{email}</p>
      </div>
      <span
        className={`text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0 ${
          isMerchant ? 'bg-amber-500/15 text-amber-400' : 'bg-emerald-500/15 text-emerald-400'
        }`}
      >
        {isMerchant ? 'تاجر' : 'مسوّق'}
      </span>
    </div>
  )
}

export function Step3Password({
  name,
  email,
  role,
  pwd,
  conf,
  errMsg,
  isLoading,
  onPwdChange,
  onConfChange,
  onBack,
  onSubmit,
}: Step3Props) {
  const [showP, setShowP] = useState(false)
  const [showC, setShowC] = useState(false)

  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <AccountSummary name={name} email={email} role={role} />

      <Field
        label="كلمة المرور"
        type={showP ? 'text' : 'password'}
        value={pwd}
        onChange={onPwdChange}
        placeholder="8 أحرف على الأقل"
        disabled={isLoading}
        autoFocus
        icon={
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="11" width="18" height="11" rx="2"/>
            <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
          </svg>
        }
        suffix={
          <button type="button" onClick={() => setShowP((p) => !p)} className="hover:text-slate-300 transition-colors">
            <EyeIcon open={showP} />
          </button>
        }
      />

      <PasswordStrength pwd={pwd} />

      <Field
        label="تأكيد كلمة المرور"
        type={showC ? 'text' : 'password'}
        value={conf}
        onChange={onConfChange}
        placeholder="أعد كتابة كلمة المرور"
        disabled={isLoading}
        icon={
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="11" width="18" height="11" rx="2"/>
            <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
          </svg>
        }
        suffix={
          <button type="button" onClick={() => setShowC((p) => !p)} className="hover:text-slate-300 transition-colors">
            <EyeIcon open={showC} />
          </button>
        }
      />

      {conf.length > 0 && (
        <p className={`text-[11px] -mt-1 ${pwd === conf ? 'text-emerald-400' : 'text-red-400'}`}>
          {pwd === conf ? 'كلمتا المرور متطابقتان ✓' : 'كلمتا المرور غير متطابقتين'}
        </p>
      )}

      <ErrorBox msg={errMsg} />

      <div className="flex gap-2 pt-1">
        <button
          type="button"
          onClick={onBack}
          disabled={isLoading}
          className="flex items-center justify-center bg-white/5 hover:bg-white/8 text-slate-400 rounded-xl py-2.5 px-4 text-sm transition-all disabled:opacity-40"
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <line x1="19" y1="12" x2="5" y2="12"/>
            <polyline points="12 19 5 12 12 5"/>
          </svg>
        </button>

        <button
          type="submit"
          disabled={isLoading}
          className="flex-1 flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl py-2.5 text-sm transition-all shadow-lg shadow-indigo-500/20 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]"
        >
          {isLoading ? <><Spinner /><span>جارٍ التسجيل...</span></> : 'إنشاء الحساب'}
        </button>
      </div>
    </form>
  )
}