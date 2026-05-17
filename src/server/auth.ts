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
const pendingInviteTypes = new Map<string, 'admin' | 'merchant'>()

export function setInviteType(email: string, type: 'admin' | 'merchant') {
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
      <h2 style="color:#1d4ed8">مرحباً بك في DzDrop</h2>
      <p>من عبدالوكيل بن عبدالمالك والي العراق والبصرة والكوفة واراضي الشام أما بعد فإذا قرأت كتابي هذا فانضم إلينا صاغرا والسلام على من اتبع الهدى وامن بالله ورسوله</p>
      <a href="${url}"
         style="display:inline-block;margin-top:16px;padding:12px 24px;
                background:#1d4ed8;color:#fff;border-radius:8px;
                text-decoration:none;font-weight:bold">
        قبول الدعوة والدخول
      </a>
      <p style="margin-top:16px;color:#6b7280;font-size:13px">
        الرابط صالح لمدة 24 ساعة فقط.
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

// ── send helper ───────────────────────────────────────────────

async function sendInviteEmail(
  to: string,
  url: string,
  type: 'admin' | 'merchant' = 'admin',
): Promise<void> {
  const subject =
    type === 'merchant'
      ? 'دعوتك للانضمام كتاجر في DzDrop'
      : 'دعوتك للانضمام إلى DzDrop'

  const html =
    type === 'merchant' ? merchantInviteHtml(url) : adminInviteHtml(url)

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

  plugins: [
    tanstackStartCookies(),
    magicLink({
      sendMagicLink: async ({ email, url }) => {
        // ✅ نقرأ نوع الدعوة من الـ callbackURL المخزّن في الـ url نفسه
        const type =pendingInviteTypes.get(email.toLowerCase().trim()) ?? 'admin'
        pendingInviteTypes.delete(email.toLowerCase().trim()) // نظّف بعد الاستخدام

        await sendInviteEmail(email, url, type)
      },
    }),
  ],

  user: {
    additionalFields: {
      role: {
        type: 'string',
        required: true,
        defaultValue: 'affiliate',
      },
      status: {
        type: 'string',
        required: true,
        defaultValue: 'pending',
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
        after: async (user) => {
          const role = (user as any).role ?? 'affiliate'

          if (role === 'affiliate') {
            const referralCode = `AFF-${user.id.slice(0, 8).toUpperCase()}`
            await db.insert(affiliateProfiles).values({
              user_id: user.id,
              referral_code: referralCode,
            })
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
