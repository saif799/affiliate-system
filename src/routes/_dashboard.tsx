// src/routes/_dashboard.tsx
import { createFileRoute, Outlet, redirect } from '@tanstack/react-router'
import {
  LayoutDashboard,
  Users,
  Megaphone,
  DollarSign,
  BarChart2,
  Code2,
  Settings,
  Zap,
  Store,
  ListOrdered,
  Truck,
} from 'lucide-react'
import { PortalShell } from './-components/shared/PortalShell'

export const Route = createFileRoute('/_dashboard')({
  beforeLoad: ({ context }) => {
    if (!context.session) throw redirect({ to: '/login' })
    if (context.session.user.status !== 'active')
      throw redirect({ to: '/pending-approval' })
    if (context.session.user.role !== 'super_admin')
      throw redirect({ to: '/login' })
  },
  component: DashboardLayout,
})

const navItems = [
  { label: 'لوحة التحكم', to: '/dashboard', icon: LayoutDashboard },
  { label: 'الطلبات', to: '/orders', icon: ListOrdered },
  { label: 'الشحنات', to: '/shipments', icon: Truck },
  { label: 'المسوّقون', to: '/affiliates', icon: Users },
  { label: 'التجّار', to: '/merchants', icon: Store },
  { label: 'المنتجات', to: '/products', icon: Megaphone },
  { label: 'العمولات', to: '/commissions', icon: DollarSign },
  { label: 'التحليلات', to: '/analytics', icon: BarChart2 },
  { label: 'مركز التكامل', to: '/integration', icon: Code2 },
  { label: 'الإعدادات', to: '/settings', icon: Settings },
]

function DashboardLayout() {
  const { session } = Route.useRouteContext()
  const userName = session?.user.name ?? 'مدير المنصّة'

  return (
    <PortalShell
      brand={{ label: 'لوحة الإدارة', icon: Zap, colorClass: 'bg-blue-600' }}
      navItems={navItems}
      user={{
        name: userName,
        roleLabel: 'مدير المنصّة',
        avatarBg: 'bg-gray-200',
        avatarFg: 'text-gray-500',
      }}
    >
      <Outlet />
    </PortalShell>
  )
}
