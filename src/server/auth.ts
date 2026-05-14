import { betterAuth }           from "better-auth"
import { drizzleAdapter }       from "better-auth/adapters/drizzle"
import { tanstackStartCookies } from "better-auth/tanstack-start"
import { magicLink }            from "better-auth/plugins"
import { Resend }               from "resend"
import nodemailer               from "nodemailer"
import { db }                   from "./db/index"
import * as schema              from "./db/schema"
import { affiliateProfiles, merchantProfiles } from "./db/schema"

// ── email clients ─────────────────────────────────────────────

const resend = new Resend(process.env.RESEND_API_KEY)

const gmailTransporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
})

// ── email template ────────────────────────────────────────────

function inviteEmailHtml(url: string): string {
  return `
    <div dir="rtl" style="font-family:sans-serif;max-width:480px;margin:auto;padding:24px">
      <h2 style="color:#1d4ed8">مرحباً بك في DzDrop</h2>
      <p>تمت دعوتك للانضمام كعضو في فريق الإدارة.</p>
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

// ── send helper ───────────────────────────────────────────────

async function sendInviteEmail(to: string, url: string): Promise<void> {
  const subject = 'دعوتك للانضمام إلى DzDrop'
  const html    = inviteEmailHtml(url)

  if (process.env.NODE_ENV === 'development') {
    // تطوير → Gmail مجاني
    await gmailTransporter.sendMail({
      from:    `"DzDrop" <${process.env.GMAIL_USER}>`,
      to,
      subject,
      html,
    })
    console.log('📧 [dev] magic link sent via Gmail to:', to)
  } else {
    // إنتاج → Resend بدومين موثق
    const { data, error } = await resend.emails.send({
      from:    'DzDrop <noreply@dzdrop.dz>',
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
    provider: "pg",
    schema: {
      user:         schema.users,
      session:      schema.sessions,
      account:      schema.accounts,
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
        await sendInviteEmail(email, url)
      },
    }),
  ],

  user: {
    additionalFields: {
      role: {
        type:         "string",
        required:     true,
        defaultValue: "affiliate",
      },
      status: {
        type:         "string",
        required:     true,
        defaultValue: "pending",
      },
      phone: {
        type:     "string",
        required: false,
      },
    },
  },

  databaseHooks: {
    user: {
      create: {
        after: async (user) => {
          const role = (user as any).role ?? "affiliate"

          if (role === "affiliate") {
            const referralCode = `AFF-${user.id.slice(0, 8).toUpperCase()}`
            await db.insert(affiliateProfiles).values({
              user_id:       user.id,
              referral_code: referralCode,
            })
          }

          if (role === "merchant") {
            await db.insert(merchantProfiles).values({
              user_id:       user.id,
              business_name: user.name,
            })
          }
        },
      },
    },
  },
})

export type Session = typeof auth.$Infer.Session