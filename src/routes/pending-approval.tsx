// src/routes/pending-approval.tsx
import { createFileRoute, redirect } from '@tanstack/react-router'
import { authClient } from '../lib/auth-client'

export const Route = createFileRoute('/pending-approval')({
 
  beforeLoad: ({ context }) => {
    if (!context.session) {
      throw redirect({ to: '/login' })
    }

    const { role, status } = context.session.user

    // إذا كان الحساب مفعّلاً → وجّهه لـ dashboard الخاص به
    if (status === 'active') {
      const roleRedirect: Record<string, string> = {
        merchant:    '/merchant/dashboard',
        affiliate:   '/affiliate/dashboard',
        super_admin: '/dashboard',
      }
      throw redirect({ to: roleRedirect[role] ?? '/login' })
    }
  },

  component: PendingApprovalPage,
})

function PendingApprovalPage() {
  const { session } = Route.useRouteContext()
  const user = session!.user

  const handleLogout = async () => {
    await authClient.signOut()
    window.location.href = '/login'
  }

  // الرسالة حسب الدور
  const roleLabel =
    user.role === 'merchant'  ? 'تاجر'  :
    user.role === 'affiliate' ? 'مسوّق' : 'مستخدم'

  return (
    <div
      dir="rtl"
      className="min-h-screen flex flex-col items-center justify-center bg-[#0B0F1A] px-4"
      style={{
        backgroundImage:
          'radial-gradient(ellipse 80% 50% at 50% -20%, rgba(99,102,241,0.12) 0%, transparent 70%)',
      }}
    >
      {/* البطاقة */}
      <div className="w-full max-w-md text-center">

        {/* أيقونة الانتظار */}
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-amber-500/10 border-2 border-amber-500/25 mb-6">
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="1.8">
            <circle cx="12" cy="12" r="10"/>
            <polyline points="12 6 12 12 16 14"/>
          </svg>
        </div>

        {/* العنوان */}
        <h1
          className="text-2xl font-bold text-white mb-2"
          style={{ fontFamily: "'Cairo', sans-serif" }}
        >
          حسابك قيد المراجعة
        </h1>

        {/* الرسالة */}
        <p className="text-slate-400 text-sm leading-relaxed mb-2">
          مرحباً <span className="text-white font-medium">{user.name}</span>،
          لقد استلمنا طلب تسجيلك كـ <span className="text-amber-400">{roleLabel}</span>.
        </p>
        <p className="text-slate-500 text-sm leading-relaxed mb-8">
          فريقنا يراجع حسابك حالياً وسيتم التفعيل قريباً.
          يرجى التحقق من بريدك الإلكتروني{' '}
          <span className="text-slate-300">{user.email}</span>{' '}
          لاستقبال إشعار التفعيل.
        </p>

        {/* مؤشر الخطوات */}
        <div className="flex items-center justify-center gap-3 mb-8">
          {/* مكتمل */}
          <div className="flex flex-col items-center gap-1">
            <div className="w-8 h-8 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2.5">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
            </div>
            <span className="text-[10px] text-emerald-400">التسجيل</span>
          </div>

          <div className="flex-1 h-px bg-amber-500/30 max-w-12"/>

          {/* حالي */}
          <div className="flex flex-col items-center gap-1">
            <div className="w-8 h-8 rounded-full bg-amber-500/20 border border-amber-500/40 flex items-center justify-center animate-pulse">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/>
                <polyline points="12 6 12 12 16 14"/>
              </svg>
            </div>
            <span className="text-[10px] text-amber-400">المراجعة</span>
          </div>

          <div className="flex-1 h-px bg-white/6 border border-white/8 max-w-12"/>

          {/* قادم */}
          <div className="flex flex-col items-center gap-1">
            <div className="w-8 h-8 rounded-full bg-white/4 border border-white/8 flex items-center justify-center">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#475569" strokeWidth="2">
                <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
              </svg>
            </div>
            <span className="text-[10px] text-slate-600">التفعيل</span>
          </div>
        </div>

        {/* زر تسجيل الخروج فقط */}
        <button
          onClick={handleLogout}
          className="inline-flex items-center gap-2 bg-white/60 hover:bg-white/10 border border-white/8 text-slate-300 hover:text-white rounded-xl px-6 py-2.5 text-sm font-medium transition-all"
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
            <polyline points="16 17 21 12 16 7"/>
            <line x1="21" y1="12" x2="9" y2="12"/>
          </svg>
          تسجيل الخروج
        </button>

      </div>

      {/* Footer */}
      <p className="absolute bottom-5 text-slate-700 text-xs">
        DzAffilio © {new Date().getFullYear()} — منصة التسويق بالعمولة
      </p>
    </div>
  )
}