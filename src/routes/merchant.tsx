// src/routes/merchant.tsx
import { createFileRoute, Outlet, Link, redirect } from '@tanstack/react-router'
import {
  LayoutDashboard,
  Users,
  Settings,
  Store,
  CreditCard,
  User,
  ListOrdered,
  Package,
  Wallet,
} from 'lucide-react'
import { getMerchantWalletBalance } from './merchant/-server/layout.api'
import { NotificationBell } from './-components/shared/NotificationBell'

export const Route = createFileRoute('/merchant')({
  beforeLoad: ({ context, location }) => {
    if (!context.session) throw redirect({ to: '/login' })
    if (context.session.user.status !== 'active')
      throw redirect({ to: '/pending-approval' })
    if (context.session.user.role !== 'merchant')
      throw redirect({ to: '/login' })
    // الصفحة الجذر /merchant مجرد تخطيط بدون محتوى → وجّه مباشرة للوحة التحكم
    if (location.pathname === '/merchant' || location.pathname === '/merchant/')
      throw redirect({ to: '/merchant/dashboard', search: { range: '7days' } })
  },
  loader: () => getMerchantWalletBalance(),
  component: MerchantLayout,
})

const navItems = [
  { label: 'لوحة التحكم', to: '/merchant/dashboard', icon: LayoutDashboard },
  { label: 'الطلبات', to: '/merchant/orders', icon: ListOrdered },
  { label: 'المنتجات', to: '/merchant/products', icon: Package },
  { label: 'المسوّقون', to: '/merchant/affiliates', icon: Users },
  { label: 'المحفظة', to: '/merchant/wallet', icon: Wallet },
  { label: 'الإعدادات', to: '/merchant/settings', icon: Settings },
]

function MerchantLayout() {
  const { session } = Route.useRouteContext()
  const { availableBalance } = Route.useLoaderData()
  const userName = session?.user.name ?? 'التاجر'
  const userRole = 'تاجر'

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      <aside className="flex w-56 flex-col justify-between border-r border-gray-200 bg-white px-3 py-5">
        <div>
          <div className="mb-5 flex items-center justify-between px-2">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-500 text-white">
                <Store size={16} strokeWidth={2.5} />
              </div>
              <span className="text-sm font-semibold text-gray-900">
                بوابة التاجر
              </span>
            </div>
            <NotificationBell />
          </div>
          <div className="mb-4 flex items-center gap-2.5 rounded-lg bg-gray-100 px-3 py-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-gray-200 text-gray-500">
              <User size={14} />
            </div>
            <div>
              <p className="text-xs font-medium text-gray-800">{userName}</p>
              <p className="text-xs text-gray-500">{userRole}</p>
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
              <p className="text-xs font-medium text-gray-700">المحفظة</p>
              <p className="mt-0.5 text-xs font-semibold text-gray-900">
                {availableBalance.toLocaleString('ar-DZ')} DZD
              </p>
            </div>
          </div>
          <div className="flex w-full items-center rounded-lg border border-gray-200 px-3 py-2 text-xs text-gray-600">
            <span>🇩🇿 DZD</span>
          </div>
        </div>
      </aside>
      <main className="flex-1 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  )
}
