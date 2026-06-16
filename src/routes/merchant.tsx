// src/routes/merchant.tsx
import { createFileRoute, Outlet, redirect } from '@tanstack/react-router'
import {
  LayoutDashboard,
  Users,
  Settings,
  Store,
  CreditCard,
  ListOrdered,
  Package,
  Wallet,
  Bell,
} from 'lucide-react'
import { getMerchantWalletBalance } from './merchant/-server/layout.api'
import { PortalShell } from './-components/shared/PortalShell'

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
  { label: 'الإشعارات', to: '/merchant/notifications', icon: Bell },
  { label: 'الإعدادات', to: '/merchant/settings', icon: Settings },
]

function MerchantLayout() {
  const { session } = Route.useRouteContext()
  const { availableBalance } = Route.useLoaderData()
  const userName = session?.user.name ?? 'التاجر'

  return (
    <PortalShell
      brand={{ label: 'بوابة التاجر', icon: Store, colorClass: 'bg-orange-500' }}
      navItems={navItems}
      user={{
        name: userName,
        roleLabel: 'تاجر',
        avatarBg: 'bg-gray-200',
        avatarFg: 'text-gray-500',
      }}
      seeAllHref="/merchant/notifications"
      footer={
        <>
          <div className="flex items-center gap-2.5 rounded-lg border border-gray-200 px-3 py-2.5">
            <CreditCard size={15} className="shrink-0 text-gray-400" />
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
        </>
      }
    >
      <Outlet />
    </PortalShell>
  )
}
