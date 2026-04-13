import type { TeamMember } from '../settings.types'

interface Props {
  members: TeamMember[]
}

const roleConfig = {
  admin: { label: 'مدير', class: 'bg-purple-100 text-purple-700' },
  finance: { label: 'مالية', class: 'bg-blue-100 text-blue-700' },
  support: { label: 'دعم', class: 'bg-green-100 text-green-700' },
}

const statusConfig = {
  active: { label: 'نشط', class: 'bg-green-100 text-green-700' },
  invited: { label: 'مدعو', class: 'bg-yellow-100 text-yellow-700' },
  suspended: { label: 'معلق', class: 'bg-red-100 text-red-700' },
}

function Avatar({ name }: { name: string }) {
  const initials = name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()
  const colors = ['bg-blue-100 text-blue-700', 'bg-purple-100 text-purple-700', 'bg-green-100 text-green-700']
  const color = colors[name.charCodeAt(0) % colors.length]
  return (
    <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold ${color}`}>
      {initials}
    </div>
  )
}

export function TeamTab({ members }: Props) {
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <p className="text-sm text-gray-500">{members.length} أعضاء في الفريق</p>
        <button className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors">
          + دعوة عضو
        </button>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50">
              <th className="text-right text-gray-500 font-medium px-5 py-3">العضو</th>
              <th className="text-right text-gray-500 font-medium px-5 py-3">الدور</th>
              <th className="text-right text-gray-500 font-medium px-5 py-3">الحالة</th>
              <th className="text-right text-gray-500 font-medium px-5 py-3">تاريخ الانضمام</th>
              <th className="text-right text-gray-500 font-medium px-5 py-3">إجراءات</th>
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
                <td className="px-5 py-4 text-gray-500">{m.joinedAt}</td>
                <td className="px-5 py-4">
                  <button className="text-xs px-3 py-1.5 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 font-medium transition-colors">
                    تعديل
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}