// src/routes/affiliate.tsx
import { createFileRoute, Outlet, Link, redirect } from '@tanstack/react-router'
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
import { getAffiliateWalletBalance } from './affiliate/-server/layout.api'
import { NotificationBell } from './-components/shared/NotificationBell'

export const Route = createFileRoute('/affiliate')({
  beforeLoad: ({ context, location }) => {
    if (!context.session) throw redirect({ to: '/login' })
    if (context.session.user.status !== 'active')
      throw redirect({ to: '/pending-approval' })
    if (context.session.user.role !== 'affiliate')
      throw redirect({ to: '/login' })
    // الصفحة الجذر /affiliate مجرد تخطيط بدون محتوى → وجّه مباشرة للوحة القيادة
    if (location.pathname === '/affiliate' || location.pathname === '/affiliate/')
      throw redirect({ to: '/affiliate/dashboard' })
  },
  loader: () => getAffiliateWalletBalance(),
  component: AffiliateLayout,
})

const navItems = [
  { label: 'Dashboard', to: '/affiliate/dashboard', icon: LayoutDashboard },
  { label: 'Orders', to: '/affiliate/orders', icon: ListOrdered },
  { label: 'Marketplace', to: '/affiliate/marketplace', icon: ShoppingBag },
  { label: 'Wallet', to: '/affiliate/wallet', icon: Wallet },
  { label: 'Settings', to: '/affiliate/settings', icon: Settings },
]

function AffiliateLayout() {
  const { session } = Route.useRouteContext()
  const { availableBalance } = Route.useLoaderData()
  const userName = session?.user.name ?? 'مسوّق'

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      <aside className="flex w-56 flex-col justify-between border-l border-gray-200 bg-white px-3 py-5">
        <div>
          <div className="mb-5 flex items-center justify-between px-2">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-600 text-white">
                <TrendingUp size={16} strokeWidth={2.5} />
              </div>
              <span className="text-sm font-semibold text-gray-900">
                بوابة المسوّق
              </span>
            </div>
            <NotificationBell />
          </div>
          <div className="mb-4 flex items-center gap-2.5 rounded-lg bg-gray-100 px-3 py-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-violet-100 text-violet-600">
              <User size={14} />
            </div>
            <div>
              <p className="text-xs font-medium text-gray-800">{userName}</p>
              <p className="text-xs text-gray-500">مسوّق</p>
            </div>
          </div>
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
        <div className="flex flex-col gap-2">
          <div className="rounded-lg border border-gray-200 px-3 py-2.5 flex items-center gap-2.5">
            <CreditCard size={15} className="text-gray-400 shrink-0" />
            <div>
              <p className="text-xs font-medium text-gray-700">الرصيد المتاح</p>
              <p className="mt-0.5 text-xs font-semibold text-violet-600">
                {availableBalance.toLocaleString('ar-DZ')} د.ج
              </p>
            </div>
          </div>
          <button className="flex w-full items-center justify-between rounded-lg border border-gray-200 px-3 py-2 text-xs text-gray-600 hover:bg-gray-50">
            <span>🇩🇿 دينار جزائري</span>
            <ChevronDown size={13} className="text-gray-400" />
          </button>
        </div>
      </aside>
      <main className="flex-1 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  )
}
