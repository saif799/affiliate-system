interface LoginCardProps {
  children: React.ReactNode
}

export function LoginCard({ children }: LoginCardProps) {
  return (
    <div
      className="bg-[#0E1420] border border-white/[0.07] rounded-2xl shadow-2xl overflow-hidden"
      style={{
        animation: 'fadeUp 0.5s ease 0.06s both',
        boxShadow: '0 32px 80px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.03)',
      }}
    >
      {/* شريط التدرج العلوي */}
      <div
        className="h-0.5"
        style={{ background: 'linear-gradient(90deg, #6366f1, #8b5cf6, #10b981)' }}
      />

      <div className="px-5 pt-5 pb-5">
        {/* عنوان */}
        <div className="mb-5">
          <h2 className="text-white text-lg font-bold">مرحباً بعودتك 👋</h2>
          <p className="text-slate-500 text-xs mt-0.5">سجّل دخولك للمتابعة إلى حسابك</p>
        </div>

        {children}

        {/* فاصل */}
        <div className="flex items-center gap-3 my-4">
          <div className="flex-1 h-px bg-white/6" />
          <span className="text-slate-700 text-[10px]">أو</span>
          <div className="flex-1 h-px bg-white/6" />
        </div>

        <p className="text-center text-slate-600 text-[11px]">
          ليس لديك حساب؟{' '}
          <a
            href="/register"
            className="text-indigo-400 hover:text-indigo-300 font-semibold transition-colors"
          >
            سجّل الآن
          </a>
        </p>
      </div>
    </div>
  )
}