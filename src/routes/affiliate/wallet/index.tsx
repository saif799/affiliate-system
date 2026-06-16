// ============================================================
// index.tsx — /affiliate/wallet
// ============================================================

import { useState } from 'react'
import { createFileRoute, useRouter } from '@tanstack/react-router'
import { getWalletData, createWithdrawalRequest } from './-server/wallet.api'
import { BalanceCards } from './-components/BalanceCards'
import { WithdrawCTA } from './-components/WithdrawCTA'
import { TransactionsLedger } from './-components/TransactionsLedger'
import { WithdrawModal } from './-components/WithdrawModal'
import type { WithdrawFormData, WithdrawalRequest } from './-wallet.types'

// ─── Route ───────────────────────────────────────────────────
export const Route = createFileRoute('/affiliate/wallet/')({
  loader: () => getWalletData(),

  pendingComponent: () => (
    <div className="flex h-64 items-center justify-center">
      <div className="h-6 w-6 animate-spin rounded-full border-2 border-gray-300 border-t-gray-900" />
    </div>
  ),

  component: WalletPage,
})

// ─── Page Component ──────────────────────────────────────────
function WalletPage() {
  const data = Route.useLoaderData()
  const router = useRouter()

  const [isModalOpen, setIsModalOpen] = useState(false)

  // نضيف طلبات السحب الجديدة locally حتى يُعاد تحميل البيانات
  const [localWithdrawals, setLocalWithdrawals] = useState<WithdrawalRequest[]>(
    data.withdrawals,
  )

  async function handleWithdrawSubmit(formData: WithdrawFormData) {
    const result = await createWithdrawalRequest({ data: formData })
    // نضيف الطلب الجديد في أعلى القائمة
    setLocalWithdrawals((prev) => [result, ...prev])
    // أعِد تحميل بيانات المحفظة كي يعكس الرصيد المتاح الخصمَ فوراً
    await router.invalidate()
  }

  return (
    <div className="space-y-4 p-6" dir='rtl'>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">المحفظة</h1>
          <p className="text-sm text-gray-500">إدارة أرباحك وطلبات السحب</p>
        </div>
      </div>

      {/* 1. بطاقات الأرصدة */}
      <BalanceCards balance={data.balance} />

      {/* 2. مركز الإجراءات */}
      <WithdrawCTA
        balance={data.balance}
        onWithdraw={() => setIsModalOpen(true)}
      />

      {/* 3. دفتر الأستاذ */}
      <TransactionsLedger
        transactions={data.transactions}
        withdrawals={localWithdrawals}
      />

      {/* 4. نافذة السحب المنبثقة */}
      {isModalOpen && (
        <WithdrawModal
          availableBalance={data.balance.available}
          onClose={() => setIsModalOpen(false)}
          onSubmit={handleWithdrawSubmit}
        />
      )}
    </div>
  )
}