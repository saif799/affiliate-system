'use client'

// إشعار Toast عصري وقابل للإغلاق — يُعرض أعلى الشاشة عبر بوابة (portal).
// يحلّ محلّ اللافتات البسيطة و alert(): أيقونة + رسالة واضحة + إغلاق يدوي/تلقائي.

import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react'

export type ToastType = 'error' | 'success' | 'info'

export interface ToastMessage {
  message: string
  type?: ToastType
}

interface ToastProps {
  toast: ToastMessage | null
  onClose: () => void
  duration?: number // ms؛ 0 = بلا إغلاق تلقائي
}

const CONFIG: Record<
  ToastType,
  { icon: typeof Info; ring: string; bg: string; iconCls: string; text: string }
> = {
  error: {
    icon: AlertCircle,
    ring: 'border-red-200',
    bg: 'bg-red-50',
    iconCls: 'text-red-500',
    text: 'text-red-800',
  },
  success: {
    icon: CheckCircle2,
    ring: 'border-green-200',
    bg: 'bg-green-50',
    iconCls: 'text-green-600',
    text: 'text-green-800',
  },
  info: {
    icon: Info,
    ring: 'border-blue-200',
    bg: 'bg-blue-50',
    iconCls: 'text-blue-500',
    text: 'text-blue-800',
  },
}

export function Toast({ toast, onClose, duration = 6000 }: ToastProps) {
  useEffect(() => {
    if (!toast || duration <= 0) return
    const t = setTimeout(onClose, duration)
    return () => clearTimeout(t)
  }, [toast, duration, onClose])

  if (!toast) return null
  const c = CONFIG[toast.type ?? 'error']
  const Icon = c.icon

  return createPortal(
    <div
      className="pointer-events-none fixed inset-x-0 top-4 z-[1200] flex justify-center px-4"
      dir="rtl"
    >
      <div
        className={`toast-in pointer-events-auto flex w-full max-w-md items-start gap-3 rounded-xl border ${c.ring} ${c.bg} px-4 py-3 shadow-lg`}
        role="alert"
      >
        <Icon size={18} className={`mt-0.5 shrink-0 ${c.iconCls}`} />
        <p className={`flex-1 text-xs leading-relaxed ${c.text}`}>{toast.message}</p>
        <button
          type="button"
          onClick={onClose}
          className="shrink-0 rounded-md p-0.5 text-gray-400 transition-colors hover:bg-black/5 hover:text-gray-600"
          aria-label="إغلاق"
        >
          <X size={14} />
        </button>
      </div>
    </div>,
    document.body,
  )
}
