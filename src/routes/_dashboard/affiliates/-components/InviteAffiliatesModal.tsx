// src/routes/_dashboard/affiliates/-components/InviteAffiliateModal.tsx
import { useState } from 'react'
import type { InviteAffiliateInput } from '../-server/affiliates.api'

interface Props {
  loading:  boolean
  onClose:  () => void
  onSubmit: (data: InviteAffiliateInput) => void
}

const INITIAL: InviteAffiliateInput = {
  name:  '',
  email: '',
  phone: '',
}

type FieldErrors = Partial<Record<keyof InviteAffiliateInput, string>>

function validate(data: InviteAffiliateInput): FieldErrors {
  const errors: FieldErrors = {}
  if (!data.name.trim())  errors.name  = 'الاسم مطلوب'
  if (!data.email.trim()) errors.email = 'البريد الإلكتروني مطلوب'
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email))
                          errors.email = 'البريد الإلكتروني غير صحيح'
  if (data.phone.trim().length < 9)
                          errors.phone = 'رقم الهاتف غير صحيح'
  return errors
}

export function InviteAffiliateModal({ loading, onClose, onSubmit }: Props) {
  const [form,   setForm]   = useState<InviteAffiliateInput>(INITIAL)
  const [errors, setErrors] = useState<FieldErrors>({})

  function handleChange(field: keyof InviteAffiliateInput, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }))
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }))
  }

  function handleSubmit() {
    const errs = validate(form)
    if (Object.keys(errs).length > 0) { setErrors(errs); return }
    onSubmit(form)
  }

  const fields: { key: keyof InviteAffiliateInput; label: string; type?: string; placeholder: string }[] = [
    { key: 'name',  label: 'الاسم الكامل',     type: 'text',  placeholder: 'مثال: أحمد بن علي' },
    { key: 'email', label: 'البريد الإلكتروني', type: 'email', placeholder: 'example@email.com' },
    { key: 'phone', label: 'رقم الهاتف',        type: 'tel',   placeholder: '0550000000'         },
  ]

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
        dir="rtl"
      >
        {/* header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-violet-50 flex items-center justify-center text-violet-600">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <line x1="19" y1="8" x2="19" y2="14" />
                <line x1="22" y1="11" x2="16" y2="11" />
              </svg>
            </div>
            <div>
              <p className="font-bold text-slate-800 text-sm">إضافة مسوق جديد</p>
              <p className="text-xs text-slate-400">سيتلقى رابط تفعيل على بريده</p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={loading}
            className="text-slate-400 hover:text-slate-600 transition-colors p-1 disabled:opacity-40"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* fields */}
        <div className="p-6 space-y-4 overflow-y-auto">
          {fields.map(({ key, label, type, placeholder }) => (
            <div key={key}>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                {label}
              </label>
              <input
                type={type ?? 'text'}
                value={form[key]}
                onChange={(e) => handleChange(key, e.target.value)}
                placeholder={placeholder}
                disabled={loading}
                className={`w-full border rounded-xl px-4 py-2.5 text-sm text-slate-700 placeholder-slate-300 focus:outline-none focus:ring-2 transition-all disabled:opacity-50 disabled:bg-slate-50 ${
                  errors[key]
                    ? 'border-red-300 focus:ring-red-300/40 focus:border-red-400'
                    : 'border-slate-200 focus:ring-violet-400/30 focus:border-violet-400'
                }`}
              />
              {errors[key] && (
                <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="8" x2="12" y2="12" />
                    <line x1="12" y1="16" x2="12.01" y2="16" />
                  </svg>
                  {errors[key]}
                </p>
              )}
            </div>
          ))}

          {/* info banner */}
          <div className="flex items-start gap-2.5 bg-violet-50 border border-violet-100 rounded-xl p-3">
            <svg className="shrink-0 mt-0.5" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#7c3aed" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <p className="text-xs text-violet-700 leading-relaxed">
              سيتم إنشاء الحساب وإرسال رابط تعيين كلمة المرور تلقائياً على البريد الإلكتروني المدخل.
            </p>
          </div>
        </div>

        {/* actions */}
        <div className="px-6 pb-6 pt-4 flex gap-2 shrink-0">
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="flex-1 flex items-center justify-center gap-2 bg-violet-600 hover:bg-violet-700 shadow-sm shadow-violet-200 disabled:opacity-50 text-white font-bold rounded-xl py-2.5 text-sm transition-colors"
          >
            {loading ? (
              <>
                <svg className="animate-spin" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
                </svg>
                جاري الإرسال...
              </>
            ) : (
              <>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <line x1="22" y1="2" x2="11" y2="13" />
                  <polygon points="22 2 15 22 11 13 2 9 22 2" />
                </svg>
                إرسال الدعوة
              </>
            )}
          </button>
          <button
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-500 text-sm hover:bg-slate-50 transition-colors disabled:opacity-40"
          >
            إلغاء
          </button>
        </div>
      </div>
    </div>
  )
}