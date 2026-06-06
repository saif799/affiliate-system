 
// ============================================================
// scripts/seed.ts — بيانات تجريبية للتطوير والفحص البصري
// التشغيل:  npx tsx scripts/seed.ts
//
// ينشئ: Super Admin + تاجر + مسوّق (جاهزون للدخول)
//        + منتجات + طلبيات بكل الحالات + تسوية مالية + طلب سحب
// إعادة التشغيل آمنة: يمسح البيانات السابقة أولاً (لا بيانات إنتاج)
// ============================================================

import { readFileSync } from 'node:fs'
import { randomUUID } from 'node:crypto'

// ── تحميل .env قبل أي import يقرأ DATABASE_URL ───────────────
for (const rawLine of readFileSync('.env', 'utf8').split('\n')) {
  const line = rawLine.trim()
  if (!line || line.startsWith('#')) continue
  const idx = line.indexOf('=')
  if (idx === -1) continue
  const key = line.slice(0, idx).trim()
  const val = line.slice(idx + 1).trim().replace(/^["']|["']$/g, '')
  if (/^[A-Za-z0-9_]+$/.test(key) && process.env[key] === undefined) {
    process.env[key] = val
  }
}

const PASSWORD = 'Passw0rd!'

async function main() {
  const { db } = await import('#/server/db')
  const { auth } = await import('#/server/auth')
  const schema = await import('#/server/db/schema')
  const { settleOrder } = await import('#/server/settlement')

  const {
    users, accounts, merchantProfiles, affiliateProfiles, wallets,
    products, orders, trackingLinks, withdrawalRequests, transactions,
    orderStatusHistory, settings, sessions,
  } = schema

  console.log('🧹 مسح البيانات السابقة…')
  // الحذف بترتيب التبعيات
  await db.delete(settings)
  await db.delete(transactions)
  await db.delete(withdrawalRequests)
  await db.delete(orderStatusHistory)
  await db.delete(orders)
  await db.delete(trackingLinks)
  await db.delete(products)
  await db.delete(wallets)
  await db.delete(affiliateProfiles)
  await db.delete(merchantProfiles)
  await db.delete(accounts)
  await db.delete(sessions)
  await db.delete(users)

  const ctx = await auth.$context
  const hash = await ctx.password.hash(PASSWORD)

  async function createUser(opts: {
    email: string
    name: string
    role: 'super_admin' | 'merchant' | 'affiliate'
    phone: string
    wilaya: string
  }): Promise<string> {
    const id = randomUUID()
    await db.insert(users).values({
      id,
      email: opts.email,
      name: opts.name,
      emailVerified: true,
      role: opts.role,
      status: 'active',
      phone: opts.phone,
      wilaya: opts.wilaya,
      approved_at: new Date(),
    })
    await db.insert(accounts).values({
      id: randomUUID(),
      userId: id,
      accountId: id,
      providerId: 'credential',
      password: hash,
    })
    return id
  }

  console.log('👤 إنشاء المستخدمين…')
  const adminId = await createUser({
    email: 'admin@dzdrop.dz', name: 'عبدالوكيل (أدمن)',
    role: 'super_admin', phone: '0550000001', wilaya: 'الجزائر',
  })
  const merchantUserId = await createUser({
    email: 'merchant@dzdrop.dz', name: 'متجر النخبة',
    role: 'merchant', phone: '0550000002', wilaya: 'وهران',
  })
  const affiliateUserId = await createUser({
    email: 'affiliate@dzdrop.dz', name: 'سمير المسوّق',
    role: 'affiliate', phone: '0550000003', wilaya: 'قسنطينة',
  })
  void adminId

  // ── الملفات والمحافظ ───────────────────────────────────────
  const [merchant] = await db
    .insert(merchantProfiles)
    .values({ user_id: merchantUserId, business_name: 'متجر النخبة', address: 'وهران، الجزائر' })
    .returning({ id: merchantProfiles.id })

  const [affiliate] = await db
    .insert(affiliateProfiles)
    .values({ user_id: affiliateUserId, referral_code: 'AFF-DEMO01' })
    .returning({ id: affiliateProfiles.id })

  await db.insert(wallets).values([
    { user_id: merchantUserId },
    { user_id: affiliateUserId },
  ])

  // ── الإعدادات المالية ──────────────────────────────────────
  await db.insert(settings).values([
    { key: 'platform_fee_merchant', value: '50' },
    { key: 'platform_fee_affiliate', value: '50' },
    { key: 'minimum_payout', value: '5000' },
    { key: 'payout_schedule', value: 'monthly' },
    { key: 'payout_methods', value: JSON.stringify(['CCP', 'BaridiMob']) },
  ])

  // ── المنتجات ───────────────────────────────────────────────
  console.log('📦 إنشاء المنتجات…')
  const productDefs = [
    { name: 'حذاء رياضي أبيض', category: 'أحذية', price: 2500, stock: 40 },
    { name: 'ساعة يد أنيقة', category: 'إلكترونيات', price: 4200, stock: 25 },
    { name: 'حقيبة ظهر جلدية', category: 'حقائب', price: 3100, stock: 8 },
    { name: 'سماعات لاسلكية', category: 'إلكترونيات', price: 1800, stock: 60 },
    { name: 'قميص قطني', category: 'ملابس', price: 1500, stock: 3 },
  ]
  const productIds: string[] = []
  for (const p of productDefs) {
    const [row] = await db
      .insert(products)
      .values({
        merchant_id: merchant.id,
        name: p.name,
        description: `${p.name} — جودة عالية وسعر تنافسي`,
        category: p.category,
        merchant_price_dzd: p.price,
        stock_qty: p.stock,
        low_stock_threshold: 10,
        sku: `SKU-${productIds.length + 1}`,
        is_active: true,
      })
      .returning({ id: products.id })
    productIds.push(row.id)
  }

  // رابط تتبّع نشط (ليظهر المسوّق في صفحة "مسوّقو التاجر")
  await db.insert(trackingLinks).values({
    product_id: productIds[0],
    affiliate_id: affiliate.id,
    slug: 'demo-link-01',
    click_count: 37,
    is_active: true,
  })

  // ── الطلبيات بكل الحالات ───────────────────────────────────
  console.log('🧾 إنشاء الطلبيات…')
  const FEE_M = 50
  const FEE_A = 50
  const customers = [
    { name: 'أمين بلقاسم', phone: '0661112233', wilaya: 'الجزائر' },
    { name: 'ياسين مرابط', phone: '0662223344', wilaya: 'البليدة' },
    { name: 'نور الهدى', phone: '0663334455', wilaya: 'سطيف' },
    { name: 'كريم حدّاد', phone: '0664445566', wilaya: 'عنابة' },
    { name: 'سارة بن علي', phone: '0665556677', wilaya: 'تلمسان' },
  ]

  type St = 'pending' | 'confirmed' | 'shipped' | 'at_wilaya' | 'delivered' | 'returned'
  const orderPlan: { status: St; productIdx: number; sale: number }[] = [
    { status: 'pending',   productIdx: 0, sale: 3500 },
    { status: 'pending',   productIdx: 3, sale: 2600 },
    { status: 'confirmed', productIdx: 1, sale: 5500 },
    { status: 'shipped',   productIdx: 2, sale: 4200 },
    { status: 'at_wilaya', productIdx: 0, sale: 3600 },
    { status: 'delivered', productIdx: 1, sale: 5800 },
    { status: 'delivered', productIdx: 3, sale: 2700 },
    { status: 'delivered', productIdx: 0, sale: 3400 },
    { status: 'returned',  productIdx: 2, sale: 4100 },
    { status: 'returned',  productIdx: 4, sale: 2200 },
  ]

  const now = Date.now()
  const deliveredIds: string[] = []
  let i = 0
  for (const o of orderPlan) {
    const cust = customers[i % customers.length]
    const merchantPrice = productDefs[o.productIdx].price
    const createdAt = new Date(now - (orderPlan.length - i) * 36 * 3600 * 1000)
    const ts = (offsetH: number) => new Date(createdAt.getTime() + offsetH * 3600 * 1000)

    const [row] = await db
      .insert(orders)
      .values({
        product_id: productIds[o.productIdx],
        affiliate_id: affiliate.id,
        merchant_id: merchant.id,
        customer_name: cust.name,
        customer_phone: cust.phone,
        customer_wilaya: cust.wilaya,
        quantity: 1,
        unit_affiliate_price_dzd: o.sale,
        unit_merchant_price_dzd: merchantPrice,
        platform_fee_merchant_dzd: FEE_M,
        platform_fee_affiliate_dzd: FEE_A,
        platform_fee_dzd: FEE_M + FEE_A,
        status: o.status,
        tracking_number: ['shipped', 'at_wilaya', 'delivered', 'returned'].includes(o.status)
          ? `YAL-${100000 + i}`
          : null,
        created_at: createdAt,
        confirmed_at: o.status === 'pending' ? null : ts(6),
        shipped_at: ['shipped', 'at_wilaya', 'delivered', 'returned'].includes(o.status) ? ts(24) : null,
        at_wilaya_at: ['at_wilaya', 'delivered'].includes(o.status) ? ts(40) : null,
        delivered_at: o.status === 'delivered' ? ts(56) : null,
      })
      .returning({ id: orders.id })

    if (o.status === 'delivered') deliveredIds.push(row.id)
    i++
  }

  // ── تسوية الطلبيات المُسلَّمة (تملأ المحافظ والمعاملات) ──────
  console.log(`💰 تسوية ${deliveredIds.length} طلبية مُسلَّمة…`)
  for (const id of deliveredIds) {
    await settleOrder(id)
  }

  // ── طلب سحب معلّق للمسوّق (لتظهر في لوحة العمولات والمحفظة) ──
  const { eq } = await import('drizzle-orm')
  const [aw] = await db
    .select({ available: wallets.available_balance_dzd })
    .from(wallets)
    .where(eq(wallets.user_id, affiliateUserId))
    .limit(1)

  if (aw && aw.available >= 5000) {
    await db.insert(withdrawalRequests).values({
      user_id: affiliateUserId,
      amount_dzd: 5000,
      method: 'CCP',
      account_number: '00799912345678',
      status: 'pending',
    })
    await db
      .update(wallets)
      .set({
        available_balance_dzd: aw.available - 5000,
        pending_balance_dzd: 5000,
      })
      .where(eq(wallets.user_id, affiliateUserId))
  }

  console.log('\n✅ تم! بيانات الدخول (كلمة المرور للجميع: ' + PASSWORD + ')')
  console.log('   • أدمن:  admin@dzdrop.dz')
  console.log('   • تاجر:  merchant@dzdrop.dz')
  console.log('   • مسوّق: affiliate@dzdrop.dz')

  process.exit(0)
}

main().catch((err) => {
  console.error('❌ فشل الـ seed:', err)
  process.exit(1)
})
