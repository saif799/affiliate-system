import type { Role, Step } from '../types/register.types'

interface Step1Props {
  role: Role | null
  onSelectRole: (r: Role) => void
  onNext: () => void
  goToStep: (s: Step) => void
}

export function Step1RoleSelect({ role, onSelectRole, onNext }: Step1Props) {
  return (
    <div className="space-y-3">

      {/* مسوّق */}
      <button
        type="button"
        onClick={() => onSelectRole('affiliate')}
        className={`
          w-full flex items-center gap-4 p-4 rounded-xl border-2 text-right transition-all duration-200
          ${role === 'affiliate'
            ? 'bg-emerald-500/10 border-emerald-500/40 ring-1 ring-emerald-500/20'
            : 'bg-white/2.5 border-white/[0.07] hover:border-white/15 hover:bg-white/4'
          }
        `}
      >
        <div
          className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 transition-all ${
            role === 'affiliate'
              ? 'bg-linear-to-br from-emerald-500 to-teal-600 shadow-lg shadow-emerald-500/25'
              : 'bg-white/6'
          }`}
        >
          <svg
            width="19"
            height="19"
            viewBox="0 0 24 24"
            fill="none"
            stroke={role === 'affiliate' ? 'white' : '#6b7280'}
            strokeWidth="1.8"
          >
            <circle cx="18" cy="5" r="3"/>
            <circle cx="6" cy="12" r="3"/>
            <circle cx="18" cy="19" r="3"/>
            <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/>
            <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
          </svg>
        </div>

        <div className="flex-1 min-w-0 text-right">
          <div className="flex items-center gap-2 mb-0.5">
            <p className={`font-bold text-sm ${role === 'affiliate' ? 'text-emerald-300' : 'text-slate-300'}`}>
              مسوّق
            </p>
            <span className="text-[10px] bg-emerald-500/15 text-emerald-500 px-1.5 py-0.5 rounded-md font-semibold">
              الأكثر شيوعاً
            </span>
          </div>
          <p className={`text-[12px] leading-snug ${role === 'affiliate' ? 'text-emerald-400/60' : 'text-slate-600'}`}>
            روّج للمنتجات واكسب عمولة على كل طلب مُسلَّم
          </p>
        </div>

        <div
          className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${
            role === 'affiliate' ? 'bg-emerald-500 border-emerald-500' : 'border-white/20'
          }`}
        >
          {role === 'affiliate' && (
            <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3.5">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
          )}
        </div>
      </button>

      {/* تاجر */}
      <button
        type="button"
        onClick={() => onSelectRole('merchant')}
        className={`
          w-full flex items-center gap-4 p-4 rounded-xl border-2 text-right transition-all duration-200
          ${role === 'merchant'
            ? 'bg-amber-500/10 border-amber-500/40 ring-1 ring-amber-500/20'
            : 'bg-white/4 border-white/8 hover:border-white/15 hover:bg-white/6'
          }
        `}
      >
        <div
          className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 transition-all ${
            role === 'merchant'
              ? 'bg-linear-to-br from-amber-500 to-orange-600 shadow-lg shadow-amber-500/25'
              : 'bg-white/6'
          }`}
        >
          <svg
            width="19"
            height="19"
            viewBox="0 0 24 24"
            fill="none"
            stroke={role === 'merchant' ? 'white' : '#6b7280'}
            strokeWidth="1.8"
          >
            <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/>
            <line x1="3" y1="6" x2="21" y2="6"/>
            <path d="M16 10a4 4 0 0 1-8 0"/>
          </svg>
        </div>

        <div className="flex-1 min-w-0 text-right">
          <p className={`font-bold text-sm mb-0.5 ${role === 'merchant' ? 'text-amber-300' : 'text-slate-300'}`}>
            تاجر
          </p>
          <p className={`text-[12px] leading-snug ${role === 'merchant' ? 'text-amber-400/60' : 'text-slate-600'}`}>
            أضف منتجاتك وابدأ البيع عبر شبكة المسوّقين
          </p>
        </div>

        <div
          className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${
            role === 'merchant' ? 'bg-amber-500 border-amber-500' : 'border-white/20'
          }`}
        >
          {role === 'merchant' && (
            <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3.5">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
          )}
        </div>
      </button>

      {/* زر المتابعة */}
      <button
        type="button"
        disabled={!role}
        onClick={onNext}
        className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-35 disabled:cursor-not-allowed text-white font-semibold rounded-xl py-2.5 text-sm transition-all active:scale-[0.98] mt-1"
      >
        المتابعة
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
          <line x1="5" y1="12" x2="19" y2="12"/>
          <polyline points="12 5 19 12 12 19"/>
        </svg>
      </button>

      <p className="text-center text-slate-600 text-[11px]">
        لديك حساب؟{' '}
        <a href="/login" className="text-indigo-400 hover:text-indigo-300 font-medium transition-colors">
          سجّل دخولك
        </a>
      </p>
    </div>
  )
}