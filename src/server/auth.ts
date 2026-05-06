// src/server/auth.ts
import { betterAuth }           from "better-auth"
import { drizzleAdapter }       from "better-auth/adapters/drizzle"
import { tanstackStartCookies } from "better-auth/tanstack-start"
import { db }                   from "./db/index"
import * as schema              from "./db/schema"
import { affiliateProfiles, merchantProfiles } from "./db/schema"

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

  plugins: [tanstackStartCookies()],

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