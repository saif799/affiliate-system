import { Field } from '../../shared/Field'
import { PasswordField } from './PasswordField'
import { ErrorBox } from '../../shared/ErrorBox'
import { Spinner } from '../../shared/Spinner'

interface LoginFormProps {
  email: string
  pwd: string
  errMsg: string
  loading: boolean
  onEmailChange: (v: string) => void
  onPwdChange: (v: string) => void
  onSubmit: (e: React.FormEvent) => void
}

export function LoginForm({
  email,
  pwd,
  errMsg,
  loading,
  onEmailChange,
  onPwdChange,
  onSubmit,
}: LoginFormProps) {
  return (
    <form onSubmit={onSubmit} className="space-y-3">

      <Field
        label="البريد الإلكتروني"
        type="email"
        value={email}
        onChange={onEmailChange}
        placeholder="example@dzdrop.dz"
        disabled={loading}
        autoFocus
        icon={
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="2" y="4" width="20" height="16" rx="2"/>
            <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
          </svg>
        }
      />

      <PasswordField
        value={pwd}
        onChange={onPwdChange}
        disabled={loading}
      />

      <ErrorBox msg={errMsg} />

      <button
        type="submit"
        disabled={loading}
        className="w-full flex items-center justify-center gap-2 text-white font-bold rounded-xl py-2.5 text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]"
        style={{
          background: 'linear-gradient(135deg, #6366f1, #7c3aed)',
          boxShadow: loading
            ? 'none'
            : '0 8px 24px rgba(99,102,241,0.32), 0 0 0 1px rgba(255,255,255,0.05)',
        }}
      >
        {loading ? (
          <><Spinner /><span>جارٍ تسجيل الدخول...</span></>
        ) : (
          <>
            <span>تسجيل الدخول</span>
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="white"
              strokeWidth="2.5"
              style={{ transform: 'scaleX(-1)' }}
            >
              <line x1="5" y1="12" x2="19" y2="12"/>
              <polyline points="12 5 19 12 12 19"/>
            </svg>
          </>
        )}
      </button>

    </form>
  )
}