import { createFileRoute, Outlet, Link } from '@tanstack/react-router'
import {
  LayoutDashboard,
  Settings,
  ShoppingBag,
  CreditCard,
  User,
  ChevronDown,
  ListOrdered,
  Wallet,
  TrendingUp,
} from 'lucide-react'

export const Route = createFileRoute('/affiliate')({
  component: AffiliateLayout,
})

const navItems = [
  { label: 'Dashboard', to: '/affiliate/dashboard',    icon: LayoutDashboard },
  { label: 'Orders',       to: '/affiliate/orders',       icon: ListOrdered },
  { label: 'Marketplace',  to: '/affiliate/marketplace',  icon: ShoppingBag },
  { label: 'Wallet',       to: '/affiliate/wallet',       icon: Wallet },
  { label: 'Settings',     to: '/affiliate/settings',     icon: Settings },
]

function AffiliateLayout() {
  return (
    <div className="flex h-screen overflow-hidden bg-gray-50" >

      {/* ─── Sidebar ─── */}
      <aside className="flex w-56 flex-col justify-between border-l border-gray-200 bg-white px-3 py-5">
        <div>

          {/* Logo */}
          <div className="mb-5 flex items-center gap-2.5 px-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-600 text-white">
              <TrendingUp size={16} strokeWidth={2.5} />
            </div>
            <span className="text-sm font-semibold text-gray-900">بوابة المسوّق</span>
          </div>

          {/* User Info */}
          <div className="mb-4 flex items-center gap-2.5 rounded-lg bg-gray-100 px-3 py-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-violet-100 text-violet-600">
              <User size={14} />
            </div>
            <div>
              <p className="text-xs font-medium text-gray-800">عبد الوكيل</p>
              <p className="text-xs text-gray-500">مسوّق</p>
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

        {/* ─── Bottom ─── */}
        <div className="flex flex-col gap-2">

          {/* Wallet Status */}
          <div className="rounded-lg border border-gray-200 px-3 py-2.5 flex items-center gap-2.5">
            <CreditCard size={15} className="text-gray-400 shrink-0" />
            <div>
              <p className="text-xs font-medium text-gray-700">الرصيد المتاح</p>
              <p className="mt-0.5 text-xs font-semibold text-violet-600">
                97,200 د.ج
              </p>
            </div>
          </div>

          {/* Currency */}
          <button className="flex w-full items-center justify-between rounded-lg border border-gray-200 px-3 py-2 text-xs text-gray-600 hover:bg-gray-50">
            <span>🇩🇿 دينار جزائري</span>
            <ChevronDown size={13} className="text-gray-400" />
          </button>
        </div>
      </aside>

      {/* ─── Main Content ─── */}
      <main className="flex-1 overflow-y-auto">
        <Outlet />
      </main>

    </div>
  )
}