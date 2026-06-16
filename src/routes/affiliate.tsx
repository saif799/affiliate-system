// src/routes/affiliate.tsx
import { createFileRoute, Outlet, redirect } from '@tanstack/react-router'
import {
  LayoutDashboard,
  Settings,
  ShoppingBag,
  CreditCard,
  ListOrdered,
  Wallet,
  TrendingUp,
  Bell,
} from 'lucide-react'
import { getAffiliateWalletBalance } from './affiliate/-server/layout.api'
import { PortalShell } from './-components/shared/PortalShell'

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
  { label: 'لوحة القيادة', to: '/affiliate/dashboard', icon: LayoutDashboard },
  { label: 'طلبياتي', to: '/affiliate/orders', icon: ListOrdered },
  { label: 'سوق المنتجات', to: '/affiliate/marketplace', icon: ShoppingBag },
  { label: 'المحفظة', to: '/affiliate/wallet', icon: Wallet },
  { label: 'الإشعارات', to: '/affiliate/notifications', icon: Bell },
  { label: 'الإعدادات', to: '/affiliate/settings', icon: Settings },
]

function AffiliateLayout() {
  const { session } = Route.useRouteContext()
  const { availableBalance } = Route.useLoaderData()
  const userName = session?.user.name ?? 'مسوّق'

  return (
    <PortalShell
      brand={{ label: 'بوابة المسوّق', icon: TrendingUp, colorClass: 'bg-violet-600' }}
      navItems={navItems}
      user={{
        name: userName,
        roleLabel: 'مسوّق',
        avatarBg: 'bg-violet-100',
        avatarFg: 'text-violet-600',
      }}
      seeAllHref="/affiliate/notifications"
      footer={
        <>
          <div className="flex items-center gap-2.5 rounded-lg border border-gray-200 px-3 py-2.5">
            <CreditCard size={15} className="shrink-0 text-gray-400" />
            <div>
              <p className="text-xs font-medium text-gray-700">الرصيد المتاح</p>
              <p className="mt-0.5 text-xs font-semibold text-violet-600">
                {availableBalance.toLocaleString('ar-DZ')} د.ج
              </p>
            </div>
          </div>
          <div className="flex w-full items-center rounded-lg border border-gray-200 px-3 py-2 text-xs text-gray-600">
            <span>🇩🇿 دينار جزائري</span>
          </div>
        </>
      }
    >
      <Outlet />
    </PortalShell>
  )
}
