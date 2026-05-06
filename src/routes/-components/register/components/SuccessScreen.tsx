export function SuccessScreen() {
  return (
    <div dir="rtl" className="min-h-screen flex items-center justify-center bg-[#080C14] px-4">
      <div className="w-full max-w-sm text-center" style={{ animation: 'fadeUp 0.5s ease both' }}>
        <div className="relative inline-flex items-center justify-center w-20 h-20 mb-6">
          <div
            className="absolute inset-0 rounded-full bg-emerald-500/20 animate-ping"
            style={{ animationDuration: '2s' }}
          />
          <div className="relative w-full h-full rounded-full bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="1.8">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
          </div>
        </div>

        <h2 className="text-2xl font-bold text-white mb-2">تم التسجيل بنجاح!</h2>
        <p className="text-slate-400 text-sm leading-relaxed mb-8">
          حسابك قيد المراجعة من قِبل الإدارة.<br/>
          ستتلقى إشعاراً فور تفعيل حسابك.
        </p>

        <a
          href="/login"
          className="inline-flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 hover:bg-emerald-500/20 rounded-xl px-6 py-2.5 text-sm font-medium transition-all"
        >
          العودة إلى تسجيل الدخول
        </a>
      </div>

      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  )
}