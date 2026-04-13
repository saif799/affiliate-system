import { createFileRoute, Outlet, Link } from '@tanstack/react-router'
import {
  LayoutDashboard,
  Users,
  Megaphone,
  DollarSign,
  BarChart2,
  Code2,
  Settings,
  Zap,
  CreditCard,
  User,
  ChevronDown,
} from 'lucide-react'

export const Route = createFileRoute('/_dashboard')({
  component: DashboardLayout,
})

const navItems = [
  { label: 'Dashboard',       to: '/dashboard',    icon: LayoutDashboard },
  { label: 'Affiliates',      to: '/affiliates',   icon: Users },
  { label: 'Campaigns',       to: '/campaigns',    icon: Megaphone },
  { label: 'Commissions',     to: '/commissions',  icon: DollarSign },
  { label: 'Analytics',       to: '/analytics',    icon: BarChart2 },
  { label: 'Integration Hub', to: '/integration', icon: Code2 },
  { label: 'Settings',        to: '/settings',     icon: Settings },
]

function DashboardLayout() {
  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">

      {/* ─── Sidebar ─── */}
      <aside className="flex w-56 flex-col justify-between border-r border-gray-200 bg-white px-3 py-5">
        <div>

          {/* Logo */}
          <div className="mb-5 flex items-center gap-2.5 px-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-white">
              <Zap size={16} strokeWidth={2.5} />
            </div>
            <span className="text-sm font-semibold text-gray-900">Tanstack-wakil</span>
          </div>

          {/* Merchant */}
          <div className="mb-4 flex items-center gap-2.5 rounded-lg bg-gray-100 px-3 py-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-gray-200 text-gray-500">
              <User size={14} />
            </div>
            <div>
              <p className="text-xs font-medium text-gray-800">Abdelouakil</p>
              <p className="text-xs text-gray-500">test19</p>
            </div>
          </div>

          {/* Nav */}
          <nav className="flex flex-col gap-0.5">
            {navItems.map(({ label, to, icon: Icon }) => (
              <Link
                key={to}
                to={to}
                className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-900"
                activeProps={{
                  className:
                    'flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm bg-gray-100 font-medium text-gray-900',
                }}
              >
                <Icon size={16} strokeWidth={1.8} />
                {label}
              </Link>
            ))}
          </nav>
        </div>

        {/* Bottom */}
        <div className="flex flex-col gap-2">
          {/* Stripe */}
          <div className="rounded-lg border border-gray-200 px-3 py-2.5 flex items-center gap-2.5">
            <CreditCard size={15} className="text-gray-400 shrink-0" />
            <div>
              <p className="text-xs font-medium text-gray-700">Stripe Payouts</p>
              <p className="mt-0.5 flex items-center gap-1 text-xs text-red-500">
                <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
                Setup required
              </p>
            </div>
          </div>

          {/* Currency */}
          <button className="flex w-full items-center justify-between rounded-lg border border-gray-200 px-3 py-2 text-xs text-gray-600 hover:bg-gray-50">
            <span>🇺🇸 USD</span>
            <ChevronDown size={13} className="text-gray-400" />
          </button>
        </div>
      </aside>

      {/* ─── Main ─── */}
      <main className="flex-1 overflow-y-auto">
        <Outlet />
      </main>

    </div>
  )
}