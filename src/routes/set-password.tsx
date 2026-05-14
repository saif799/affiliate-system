// src/routes/set-password.tsx
import { createFileRoute, redirect, useNavigate } from '@tanstack/react-router'
import { useState }                                from 'react'
import { checkHasPassword, setPassword }           from '#/server/set-password.api'

export const Route = createFileRoute('/set-password')({
  // ── route guard ─────────────────────────────────────────────
  //
  //  Runs on the server before the component renders.
  //  Two rules:
  //    1. No session    → the user didn't come via the magic link → /login
  //    2. Has password  → already set it before         → /dashboard
  //
  beforeLoad: async ({ context }) => {
    // Rule 1 — session is injected into router context by __root.tsx
    if (!(context as any).session?.user?.id) {
      throw redirect({ to: '/login' })
    }

    // Rule 2 — if a credential row already exists, skip the page
    const hasPassword = await checkHasPassword()
    if (hasPassword) {
      throw redirect({ to: '/dashboard' })
    }
  },

  component: SetPasswordPage,
})

// ── component ─────────────────────────────────────────────────

function SetPasswordPage() {
  const navigate  = useNavigate()
  const [pw,      setPw]      = useState('')
  const [pw2,     setPw2]     = useState('')
  const [show1,   setShow1]   = useState(false)
  const [show2,   setShow2]   = useState(false)
  const [error,   setError]   = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  async function handleSubmit() {
    setError('')

    if (pw.length < 8) {
      setError('كلمة المرور يجب أن تكون 8 أحرف على الأقل')
      return
    }
    if (pw !== pw2) {
      setError('كلمتا المرور غير متطابقتين')
      return
    }

    setLoading(true)
    try {
      await setPassword({ data: { password: pw } })
      setSuccess(true)
      setTimeout(() => navigate({ to: '/dashboard' }), 1500)
    } catch (err: any) {
      setError(err?.message ?? 'حدث خطأ، حاول مجدداً')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      dir="rtl"
      className="min-h-screen flex items-center justify-center bg-[#080C14] px-4"
      style={{
        backgroundImage: `
          radial-gradient(ellipse 60% 40% at 30% 10%, rgba(99,102,241,0.12) 0%, transparent 60%),
          radial-gradient(ellipse 40% 30% at 80% 80%, rgba(16,185,129,0.07) 0%, transparent 60%)
        `,
      }}
    >
      <div className="w-full max-w-sm">

        {/* شعار */}
        <div className="text-center mb-7" style={{ animation: 'fadeUp 0.4s ease both' }}>
          <div className="inline-flex flex-col items-center gap-1">
            <div
              className="w-11 h-11 rounded-2xl flex items-center justify-center mb-1"
              style={{
                background: 'linear-gradient(135deg, #6366f1, #7c3aed)',
                boxShadow:  '0 8px 24px rgba(99,102,241,0.35)',
                animation:  'float 4s ease-in-out infinite',
              }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2">
                <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
              </svg>
            </div>
            <span className="text-white font-bold text-xl tracking-tight">DzDrop</span>
            <p className="text-slate-600 text-[10px] uppercase tracking-widest">منصة التسويق بالعمولة</p>
          </div>
        </div>

        {/* البطاقة */}
        <div
          className="bg-[#0E1420] border border-white/[0.07] rounded-2xl overflow-hidden"
          style={{
            animation: 'fadeUp 0.5s ease 0.06s both',
            boxShadow: '0 32px 80px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.03)',
          }}
        >
          {/* شريط التدرج */}
          <div
            className="h-0.5"
            style={{ background: 'linear-gradient(90deg, #6366f1, #8b5cf6, #10b981)' }}
          />

          <div className="px-5 pt-5 pb-6">

            {success ? (
              /* ── شاشة النجاح ── */
              <div className="text-center py-6" style={{ animation: 'fadeUp 0.3s ease both' }}>
                <div
                  className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4"
                  style={{ background: 'rgba(16,185,129,0.15)' }}
                >
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2.5">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                </div>
                <h2 className="text-white text-lg font-bold mb-1">تم بنجاح! 🎉</h2>
                <p className="text-slate-500 text-sm">جاري تحويلك للوحة التحكم...</p>
              </div>
            ) : (
              <>
                {/* العنوان */}
                <div className="mb-5">
                  <h2 className="text-white text-[17px] font-bold">إنشاء كلمة المرور 🔐</h2>
                  <p className="text-slate-500 text-xs mt-0.5">
                    اختر كلمة مرور لحسابك في DzDrop
                  </p>
                </div>

                {/* حقل كلمة المرور */}
                <div className="space-y-1.5 mb-3">
                  <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                    كلمة المرور
                  </label>
                  <div className="relative group">
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-600 pointer-events-none group-focus-within:text-indigo-400 transition-colors">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="3" y="11" width="18" height="11" rx="2"/>
                        <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                      </svg>
                    </span>
                    <input
                      type={show1 ? 'text' : 'password'}
                      value={pw}
                      onChange={e => { setPw(e.target.value); setError('') }}
                      placeholder="••••••••"
                      disabled={loading}
                      className="w-full bg-white/4 border border-white/8 text-white placeholder-slate-700 rounded-xl py-2.5 text-sm pr-10 pl-10 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500/50 focus:bg-white/6 transition-all duration-200 disabled:opacity-40 caret-indigo-400"
                    />
                    <button
                      type="button"
                      tabIndex={-1}
                      onClick={() => setShow1(p => !p)}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600 hover:text-slate-300 transition-colors"
                    >
                      {show1
                        ? <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                        : <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                      }
                    </button>
                  </div>
                </div>

                {/* حقل التأكيد */}
                <div className="space-y-1.5 mb-4">
                  <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                    تأكيد كلمة المرور
                  </label>
                  <div className="relative group">
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-600 pointer-events-none group-focus-within:text-indigo-400 transition-colors">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="3" y="11" width="18" height="11" rx="2"/>
                        <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                      </svg>
                    </span>
                    <input
                      type={show2 ? 'text' : 'password'}
                      value={pw2}
                      onChange={e => { setPw2(e.target.value); setError('') }}
                      placeholder="••••••••"
                      disabled={loading}
                      className="w-full bg-white/4 border border-white/8 text-white placeholder-slate-700 rounded-xl py-2.5 text-sm pr-10 pl-10 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500/50 focus:bg-white/6 transition-all duration-200 disabled:opacity-40 caret-indigo-400"
                    />
                    <button
                      type="button"
                      tabIndex={-1}
                      onClick={() => setShow2(p => !p)}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600 hover:text-slate-300 transition-colors"
                    >
                      {show2
                        ? <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                        : <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                      }
                    </button>
                  </div>
                </div>

                {/* رسالة الخطأ */}
                {error && (
                  <div className="mb-3 px-3 py-2 rounded-xl bg-red-500/10 border border-red-500/20">
                    <p className="text-red-400 text-xs">{error}</p>
                  </div>
                )}

                {/* زر الحفظ */}
                <button
                  onClick={handleSubmit}
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 text-white font-bold rounded-xl py-2.5 text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]"
                  style={{
                    background: 'linear-gradient(135deg, #6366f1, #7c3aed)',
                    boxShadow:  loading ? 'none' : '0 8px 24px rgba(99,102,241,0.32)',
                  }}
                >
                  {loading ? (
                    <>
                      <svg className="animate-spin" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                        <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
                      </svg>
                      <span>جاري الحفظ...</span>
                    </>
                  ) : (
                    <>
                      <span>حفظ وتسجيل الدخول</span>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" style={{ transform: 'scaleX(-1)' }}>
                        <line x1="5" y1="12" x2="19" y2="12"/>
                        <polyline points="12 5 19 12 12 19"/>
                      </svg>
                    </>
                  )}
                </button>
              </>
            )}
          </div>
        </div>

        <p className="text-center text-slate-700 text-[11px] mt-4">
          DzDrop © {new Date().getFullYear()} — منصة التسويق بالعمولة
        </p>
      </div>

      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50%       { transform: translateY(-4px); }
        }
      `}</style>
    </div>
  )
}