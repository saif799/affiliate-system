export function BrandLogo() {
  return (
    <div className="text-center mb-7" style={{ animation: 'fadeUp 0.4s ease both' }}>
      <div className="inline-flex flex-col items-center gap-1">
        <div
          className="w-11 h-11 rounded-2xl flex items-center justify-center mb-1"
          style={{
            background: 'linear-gradient(135deg, #6366f1, #7c3aed)',
            boxShadow: '0 8px 24px rgba(99,102,241,0.35)',
            animation: 'float 4s ease-in-out infinite',
          }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2">
            <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
          </svg>
        </div>
        <span className="text-white font-bold text-xl tracking-tight">DzAffilio</span>
        <p className="text-slate-600 text-[10px] uppercase tracking-widest">منصة التسويق بالعمولة</p>
      </div>
    </div>
  )
}