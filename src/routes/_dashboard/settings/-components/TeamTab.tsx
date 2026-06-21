'use client'

import { useState } from 'react'
import type { TeamMember, TeamRole, TeamMemberStatus } from '../-settings.types'
import { inviteTeamMember } from '../-server/settings.api'

interface Props {
  members: TeamMember[]
}

const roleConfig: Record<TeamRole, { label: string; class: string }> = {
  super_admin: { label: 'مدير',   class: 'bg-purple-100 text-purple-700' },
  merchant:    { label: 'تاجر',   class: 'bg-blue-100 text-blue-700'     },
  affiliate:   { label: 'مسوّق',  class: 'bg-green-100 text-green-700'   },
  system:      { label: 'نظام',   class: 'bg-gray-100 text-gray-600'     },
}

const statusConfig: Record<TeamMemberStatus, { label: string; class: string }> = {
  active:    { label: 'نشط',   class: 'bg-green-100 text-green-700'   },
  pending:   { label: 'معلّق', class: 'bg-yellow-100 text-yellow-700' },
  suspended: { label: 'موقوف', class: 'bg-red-100 text-red-700'       },
}

function Avatar({ name }: { name: string }) {
  const initials = name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()
  const colors = [
    'bg-blue-100 text-blue-700',
    'bg-purple-100 text-purple-700',
    'bg-green-100 text-green-700',
  ]
  const color = colors[name.charCodeAt(0) % colors.length]
  return (
    <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold ${color}`}>
      {initials}
    </div>
  )
}

// ── Invite Modal ──────────────────────────────────────────────

interface InviteModalProps {
  onClose:   () => void
  onSuccess: (member: TeamMember) => void
}

function InviteModal({ onClose, onSuccess }: InviteModalProps) {
  const [name,   setName]   = useState('')
  const [email,  setEmail]  = useState('')
  const [saving, setSaving] = useState(false)
  const [error,  setError]  = useState<string | null>(null)

  async function handleSubmit() {
    if (!name.trim())  { setError('الاسم مطلوب');             return }
    if (!email.trim()) { setError('البريد الإلكتروني مطلوب'); return }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('البريد الإلكتروني غير صحيح')
      return
    }

    setSaving(true)
    setError(null)

    try {
      // الدور ثابت دائماً super_admin — لا خيار آخر
      const newMember = await inviteTeamMember({
        data: { name, email, role: 'super_admin' },
      })
      onSuccess(newMember)
      onClose()
    } catch {
      setError('حدث خطأ أثناء الدعوة، حاول مجدداً')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md mx-4 p-6 space-y-5" dir="rtl">

        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-semibold text-gray-900">دعوة مدير جديد</h3>
            <p className="text-xs text-gray-400 mt-0.5">
              سيصله رابط دخول على بريده الإلكتروني
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-xl leading-none"
          >
            ×
          </button>
        </div>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-700">الاسم الكامل</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="مثال: أحمد بن عمر"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition bg-gray-50"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-700">البريد الإلكتروني</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="example@dzaffilio.dz"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition bg-gray-50"
            />
          </div>

          {/* لا يوجد select للدور — ثابت على super_admin */}
          <div className="flex items-center gap-2 bg-purple-50 rounded-lg px-3 py-2.5">
            <span className="text-purple-600 text-xs">👑</span>
            <p className="text-xs text-purple-700">
              سيُضاف هذا الشخص كـ <strong>مدير</strong> للمنصة
            </p>
          </div>
        </div>

        {error && (
          <p className="text-xs text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>
        )}

        <div className="flex gap-2 justify-end pt-1">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-sm text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors"
          >
            إلغاء
          </button>
          <button
            onClick={handleSubmit}
            disabled={saving}
            className="px-4 py-2 rounded-lg text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 transition-colors disabled:opacity-60"
          >
            {saving ? 'جاري الإرسال...' : 'إرسال الدعوة'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Main component ────────────────────────────────────────────

export function TeamTab({ members: initialMembers }: Props) {
  const [members,    setMembers]    = useState(initialMembers)
  const [showInvite, setShowInvite] = useState(false)

  function handleNewMember(member: TeamMember) {
    setMembers((prev) => [...prev, member])
  }

  return (
    <div className="space-y-4">

      <div className="flex justify-between items-center">
        <p className="text-sm text-gray-500">{members.length} أعضاء في الفريق</p>
        <button
          onClick={() => setShowInvite(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
        >
          + دعوة مدير
        </button>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50">
              {['العضو', 'الدور', 'الحالة', 'تاريخ الانضمام'].map((h) => (
                <th key={h} className="text-right text-gray-500 font-medium px-5 py-3">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {members.map((m) => (
              <tr key={m.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-5 py-4">
                  <div className="flex items-center gap-3">
                    <Avatar name={m.name} />
                    <div>
                      <p className="font-medium text-gray-900">{m.name}</p>
                      <p className="text-gray-400 text-xs">{m.email}</p>
                    </div>
                  </div>
                </td>
                <td className="px-5 py-4">
                  <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${roleConfig[m.role].class}`}>
                    {roleConfig[m.role].label}
                  </span>
                </td>
                <td className="px-5 py-4">
                  <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${statusConfig[m.status].class}`}>
                    {statusConfig[m.status].label}
                  </span>
                </td>
                <td className="px-5 py-4 text-gray-500">
                  {m.joined_at ? new Date(m.joined_at).toLocaleDateString('fr-DZ') : '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showInvite && (
        <InviteModal
          onClose={() => setShowInvite(false)}
          onSuccess={handleNewMember}
        />
      )}
    </div>
  )
}