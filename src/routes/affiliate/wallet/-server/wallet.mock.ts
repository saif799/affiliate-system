// ============================================================
// -server/wallet.mock.ts
// ============================================================

import type { WalletData } from '../-wallet.types'

export const mockWalletData: WalletData = {
  balance: {
    available: 3200,
    pending: 7650,
    totalEarned: 84320,
    minWithdrawAmount: 5000,
  },

  transactions: [
    {
      id: 'tx-001',
      type: 'commission',
      amount: 3000,
      description: 'عمولة طلبية',
      orderId: 'ORD-0047',
      productName: 'جاكيت جلد كلاسيكي رجالي',
      date: '2026-04-20T10:30:00Z',
    },
    {
      id: 'tx-002',
      type: 'commission',
      amount: 2400,
      description: 'عمولة طلبية',
      orderId: 'ORD-0045',
      productName: 'سماعات بلوتوث XG500 Pro',
      date: '2026-04-18T14:15:00Z',
    },
    {
      id: 'tx-003',
      type: 'withdrawal',
      amount: -10000,
      description: 'طلب سحب',
      orderId: undefined,
      productName: undefined,
      date: '2026-04-14T09:00:00Z',
    },
    {
      id: 'tx-004',
      type: 'commission',
      amount: 2300,
      description: 'عمولة طلبية',
      orderId: 'ORD-0041',
      productName: 'ساعة ذكية ProWatch S8',
      date: '2026-04-10T16:45:00Z',
    },
    {
      id: 'tx-005',
      type: 'commission',
      amount: 8000,
      description: 'عمولة طلبية',
      orderId: 'ORD-0039',
      productName: 'مكيف هواء نقال BTU 12000',
      date: '2026-04-07T11:20:00Z',
    },
    {
      id: 'tx-006',
      type: 'deduction',
      amount: -3000,
      description: 'خصم روتور',
      orderId: 'ORD-0033',
      productName: 'جاكيت جلد — مُرتجع',
      date: '2026-04-03T08:00:00Z',
    },
    {
      id: 'tx-007',
      type: 'commission',
      amount: 2300,
      description: 'عمولة طلبية',
      orderId: 'ORD-0030',
      productName: 'ساعة ذكية ProWatch S8',
      date: '2026-03-29T13:10:00Z',
    },
    {
      id: 'tx-008',
      type: 'commission',
      amount: 8000,
      description: 'عمولة طلبية',
      orderId: 'ORD-0028',
      productName: 'مكيف هواء نقال BTU 12000',
      date: '2026-03-25T10:00:00Z',
    },
  ],

  withdrawals: [
    {
      id: 'WD-0012',
      amount: 10000,
      method: 'ccp',
      accountNumber: '0799 123 456',
      status: 'completed',
      date: '2026-04-14T09:00:00Z',
    },
    {
      id: 'WD-0011',
      amount: 15000,
      method: 'ccp',
      accountNumber: '0799 123 456',
      status: 'completed',
      date: '2026-03-28T10:30:00Z',
    },
    {
      id: 'WD-0010',
      amount: 8500,
      method: 'bank',
      accountNumber: '0021 0017 ****',
      status: 'pending',
      date: '2026-03-12T14:00:00Z',
    },
    {
      id: 'WD-0009',
      amount: 12000,
      method: 'ccp',
      accountNumber: '0799 123 456',
      status: 'rejected',
      date: '2026-03-02T09:15:00Z',
      rejectionReason: 'رقم الحساب غير صحيح',
    },
  ],
}