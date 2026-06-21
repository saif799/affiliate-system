import { Field } from '../../shared/Field'
import { ErrorBox } from '../../shared/ErrorBox'

interface Step2Props {
  name: string
  email: string
  phone: string
  errMsg: string
  isLoading: boolean
  onNameChange: (v: string) => void
  onEmailChange: (v: string) => void
  onPhoneChange: (v: string) => void
  onBack: () => void
  onNext: () => void
}

export function Step2UserInfo({
  name,
  email,
  phone,
  errMsg,
  isLoading,
  onNameChange,
  onEmailChange,
  onPhoneChange,
  onBack,
  onNext,
}: Step2Props) {
  return (
    <div className="space-y-3">
      <Field
        label="الاسم الكامل"
        value={name}
        onChange={onNameChange}
        placeholder="أحمد بن علي"
        disabled={isLoading}
        autoFocus
        icon={
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
            <circle cx="12" cy="7" r="4"/>
          </svg>
        }
      />

      <Field
        label="البريد الإلكتروني"
        type="email"
        value={email}
        onChange={onEmailChange}
        placeholder="example@dzaffilio.dz"
        disabled={isLoading}
        icon={
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="2" y="4" width="20" height="16" rx="2"/>
            <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
          </svg>
        }
      />

      <Field
        label="رقم الهاتف — اختياري"
        type="tel"
        value={phone}
        onChange={onPhoneChange}
        placeholder="0551234567"
        disabled={isLoading}
        icon={
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 13.5 19.79 19.79 0 0 1 1.61 4.9 2 2 0 0 1 3.6 2.7h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 10.09a16 16 0 0 0 6 6z"/>
          </svg>
        }
      />

      <ErrorBox msg={errMsg} />

      <div className="flex gap-2 pt-1">
        <button
          type="button"
          onClick={onBack}
          className="flex items-center justify-center bg-white/5 hover:bg-white/8 text-slate-400 rounded-xl py-2.5 px-4 text-sm transition-all"
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <line x1="19" y1="12" x2="5" y2="12"/>
            <polyline points="12 19 5 12 12 5"/>
          </svg>
        </button>

        <button
          type="button"
          onClick={onNext}
          className="flex-1 flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl py-2.5 text-sm transition-all active:scale-[0.98]"
        >
          المتابعة
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
            <line x1="5" y1="12" x2="19" y2="12"/>
            <polyline points="12 5 19 12 12 19"/>
          </svg>
        </button>
      </div>
    </div>
  )
}