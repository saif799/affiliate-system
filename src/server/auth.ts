import { betterAuth } from 'better-auth'
import { drizzleAdapter } from 'better-auth/adapters/drizzle'
import { tanstackStartCookies } from 'better-auth/tanstack-start'
import { magicLink } from 'better-auth/plugins'
import { Resend } from 'resend'
import nodemailer from 'nodemailer'
import { db } from './db/index'
import * as schema from './db/schema'
import { affiliateProfiles, merchantProfiles } from './db/schema'
import { eq } from 'drizzle-orm'

// ── email clients ─────────────────────────────────────────────

const resend = new Resend(process.env.RESEND_API_KEY)
const pendingInviteTypes = new Map<string, 'admin' | 'merchant' | 'affiliate'>()

export function setInviteType(
  email: string,
  type: 'admin' | 'merchant' | 'affiliate',
) {
  pendingInviteTypes.set(email.toLowerCase().trim(), type)
}

const gmailTransporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
})

// ── email templates ───────────────────────────────────────────

function adminInviteHtml(url: string): string {
  return `
    <div dir="rtl" style="font-family:sans-serif;max-width:480px;margin:auto;padding:24px">
      <h2 style="color:#1d4ed8">مرحباً بك في DzDrop 🎉</h2>
      <p style="color:#374151;line-height:1.7">
        تمت دعوتك للانضمام كمدير على منصة <strong>DzDrop</strong>.<br/>
        انقر على الزر أدناه لقبول الدعوة وتعيين كلمة المرور الخاصة بك والوصول إلى لوحة الإدارة.
      </p>
      <a href="${url}"
         style="display:inline-block;margin-top:20px;padding:12px 28px;
                background:#1d4ed8;color:#fff;border-radius:8px;
                text-decoration:none;font-weight:bold;font-size:15px">
        قبول الدعوة وتعيين كلمة المرور
      </a>
      <hr style="margin:24px 0;border:none;border-top:1px solid #e5e7eb"/>
      <p style="color:#6b7280;font-size:12px;line-height:1.6">
        الرابط صالح لمدة 24 ساعة فقط.<br/>
        إذا لم تطلب هذه الدعوة يمكنك تجاهل هذا البريد بأمان.
      </p>
    </div>
  `
}

function merchantInviteHtml(url: string): string {
  return `
    <div dir="rtl" style="font-family:sans-serif;max-width:480px;margin:auto;padding:24px">
      <h2 style="color:#4f46e5">مرحباً بك في DzDrop 🎉</h2>
      <p style="color:#374151;line-height:1.7">
        تمت دعوتك للانضمام كتاجر على منصة <strong>DzDrop</strong>.<br/>
        انقر على الزر أدناه لقبول الدعوة وتعيين كلمة المرور الخاصة بك والبدء في إدارة متجرك.
      </p>
      <a href="${url}"
         style="display:inline-block;margin-top:20px;padding:12px 28px;
                background:#4f46e5;color:#fff;border-radius:8px;
                text-decoration:none;font-weight:bold;font-size:15px">
        قبول الدعوة وتعيين كلمة المرور
      </a>
      <hr style="margin:24px 0;border:none;border-top:1px solid #e5e7eb"/>
      <p style="color:#6b7280;font-size:12px;line-height:1.6">
        الرابط صالح لمدة 24 ساعة فقط.<br/>
        إذا لم تطلب هذه الدعوة يمكنك تجاهل هذا البريد بأمان.
      </p>
    </div>
  `
}

function affiliateInviteHtml(url: string): string {
  return `
    <div dir="rtl" style="font-family:sans-serif;max-width:480px;margin:auto;padding:24px">
      <h2 style="color:#7c3aed">مرحباً بك في DzDrop 🎉</h2>
      <p style="color:#374151;line-height:1.7">
        تمت دعوتك للانضمام كمسوق على منصة <strong>DzDrop</strong>.<br/>
        انقر على الزر أدناه لقبول الدعوة وتعيين كلمة المرور الخاصة بك والبدء في رحلتك التسويقية.
      </p>
      <a href="${url}"
         style="display:inline-block;margin-top:20px;padding:12px 28px;
                background:#7c3aed;color:#fff;border-radius:8px;
                text-decoration:none;font-weight:bold;font-size:15px">
        قبول الدعوة وتعيين كلمة المرور
      </a>
      <hr style="margin:24px 0;border:none;border-top:1px solid #e5e7eb"/>
      <p style="color:#6b7280;font-size:12px;line-height:1.6">
        الرابط صالح لمدة 24 ساعة فقط.<br/>
        إذا لم تطلب هذه الدعوة يمكنك تجاهل هذا البريد بأمان.
      </p>
    </div>
  `
}

// ── send helper ───────────────────────────────────────────────

async function sendInviteEmail(
  to: string,
  url: string,
  type: 'admin' | 'merchant' | 'affiliate' = 'admin',
): Promise<void> {
  const subject =
    type === 'merchant'
      ? 'دعوتك للانضمام كتاجر في DzDrop'
      : type === 'affiliate'
        ? 'دعوتك للانضمام كمسوق في DzDrop'
        : 'دعوتك للانضمام إلى DzDrop'

  const html =
    type === 'merchant'
      ? merchantInviteHtml(url)
      : type === 'affiliate'
        ? affiliateInviteHtml(url)
        : adminInviteHtml(url)

  if (process.env.NODE_ENV === 'development') {
    await gmailTransporter.sendMail({
      from: `"DzDrop" <${process.env.GMAIL_USER}>`,
      to,
      subject,
      html,
    })
  } else {
    const { data, error } = await resend.emails.send({
      from: 'DzDrop <noreply@dzdrop.dz>',
      to,
      subject,
      html,
    })
    if (error) throw new Error(`Resend error: ${JSON.stringify(error)}`)
    console.log('📧 [prod] magic link sent via Resend, id:', data?.id)
  }
}

// ── auth ──────────────────────────────────────────────────────

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: 'pg',
    schema: {
      user: schema.users,
      session: schema.sessions,
      account: schema.accounts,
      verification: schema.verifications,
    },
  }),

  emailAndPassword: {
    enabled: true,
  },

  // الحد من المعدّل — يمنع تخمين كلمة المرور والإغراق على نقاط الدخول
  rateLimit: {
    enabled: true,
    window: 60, // ثانية
    max: 100, // الحدّ الافتراضي العام لكل IP في النافذة
    customRules: {
      '/sign-in/email': { window: 60, max: 5 },
      '/sign-up/email': { window: 60, max: 5 },
      '/magic-link/verify': { window: 60, max: 10 },
    },
  },

  plugins: [
    tanstackStartCookies(),
    magicLink({
      sendMagicLink: async ({ email, url }) => {
        const type =
          pendingInviteTypes.get(email.toLowerCase().trim()) ?? 'admin'
        pendingInviteTypes.delete(email.toLowerCase().trim())
        await sendInviteEmail(email, url, type)
      },
    }),
  ],

  user: {
    additionalFields: {
      // أمان حرج: التسجيل الذاتي يختار دوره (تاجر/مسوّق) من النموذج، لكن القيمة
      // غير موثوقة (نقطة /sign-up/email عامّة). لذا role يقبل الإدخال (input:true)
      // ثم يُقصّ في hook الإنشاء (create.before) إلى ['merchant','affiliate'] فقط —
      // فأيّ محاولة لإرسال role:"super_admin"/"system" تُحوَّل قسراً إلى "affiliate".
      // status يبقى مضبوطاً من الخادم فقط (input:false ⇒ pending) فلا يُفعِّل أحدٌ
      // حسابه ذاتيّاً. دعوات الأدمن/التاجر/المسوّق تُنشئ المستخدم بإدراج مباشر
      // موثّق (تتجاوز هذا الـ hook)، فلا تتأثّر بالقصّ.
      role: {
        type: 'string',
        required: true,
        defaultValue: 'affiliate',
        input: true, // ← يُقبَل من النموذج ثم يُقصّ بأمان في create.before
      },
      status: {
        type: 'string',
        required: true,
        defaultValue: 'pending',
        input: false, // ← يمنع التصعيد عبر /sign-up مع إبقاء النوع غير-null
      },
      phone: {
        type: 'string',
        required: false,
      },
    },
  },

  databaseHooks: {
    user: {
      create: {
        // ── قصّ الدور (أمان حرج) ──────────────────────────────────
        // يعمل فقط على إنشاء المستخدمين عبر better-auth (التسجيل الذاتي على
        // /sign-up/email). دعوات الأدمن/التاجر/المسوّق تُدرِج الصفّ بـ Drizzle
        // مباشرةً فلا تمرّ من هنا. نقصّ الدور إلى تاجر/مسوّق فقط ونفرض pending
        // كي يستحيل التصعيد إلى super_admin أو تفعيل الحساب ذاتيّاً.
        before: async (user) => {
          const requested = (user as { role?: unknown }).role
          const safeRole = requested === 'merchant' ? 'merchant' : 'affiliate'
          return { data: { ...user, role: safeRole, status: 'pending' } }
        },
        after: async (user) => {
          const role = (user as any).role ?? 'affiliate'

          if (role === 'affiliate') {
            // ✅ نتحقق أولاً — inviteAffiliate ينشئ الـ profile قبل الـ hook
            const existing = await db
              .select({ id: affiliateProfiles.id })
              .from(affiliateProfiles)
              .where(eq(affiliateProfiles.user_id, user.id))
              .limit(1)

            if (existing.length === 0) {
              const referralCode = `AFF-${user.id.slice(0, 8).toUpperCase()}`
              await db.insert(affiliateProfiles).values({
                user_id: user.id,
                referral_code: referralCode,
              })
            }
          }

          if (role === 'merchant') {
            // ✅ نتحقق أولاً — inviteMerchant ينشئ الـ profile قبل الـ hook
            const existing = await db
              .select({ id: merchantProfiles.id })
              .from(merchantProfiles)
              .where(eq(merchantProfiles.user_id, user.id))
              .limit(1)

            if (existing.length === 0) {
              await db.insert(merchantProfiles).values({
                user_id: user.id,
                business_name: user.name,
              })
            }
          }
        },
      },
    },
  },
})

export type Session = typeof auth.$Infer.Session
