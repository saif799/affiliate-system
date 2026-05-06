import { createFileRoute, useRouter } from '@tanstack/react-router'
import { useState } from 'react'
import { signIn } from '../lib/auth-client'

import { BrandLogo } from './-components/login/components/BrandLogo'
import { LoginCard } from './-components/login/components/LoginCard'
import { LoginForm } from './-components/login/components/LoginForm'

export const Route = createFileRoute('/_auth/login')({
  component: LoginPage,
})



function LoginPage() {
  const router = useRouter()

  const [email, setEmail] = useState('')
  const [pwd, setPwd] = useState('')
  const [loading, setLoading] = useState(false)
  const [errMsg, setErr] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErr('')

    if (!email.trim()) {
      setErr('يرجى إدخال البريد الإلكتروني')
      return
    }
    if (!email.includes('@')) {
      setErr('البريد الإلكتروني غير صالح')
      return
    }
    if (!pwd) {
      setErr('يرجى إدخال كلمة المرور')
      return
    }

    setLoading(true)
    const { data, error } = await signIn.email({ email, password: pwd })
    setLoading(false)

    if (error) {
      setErr('البريد الإلكتروني أو كلمة المرور غير صحيحة')
      return
    }

    const user = data?.user as any
    const status = user?.status ?? 'pending'
    const role = user?.role ?? 'affiliate'

    // ① حساب pending أو suspended → غرفة الانتظار
    if (status !== 'active') {
      router.navigate({ to: '/pending-approval' })
      return
    }

    // ② حساب active → dashboard الخاص بالدور
    const roleDashboard: Record<string, string> = {
      super_admin: '/dashboard',
      merchant: '/merchant',
      affiliate: '/affiliate',
    }
    router.navigate({ to: roleDashboard[role] ?? '/affiliate' })
  }

  return (
    <div
      dir="rtl"
      className="min-h-screen flex items-center justify-center bg-[#080C14] px-4 py-8"
      style={{
        backgroundImage: `
          radial-gradient(ellipse 70% 50% at 25% 15%, rgba(99,102,241,0.13) 0%, transparent 60%),
          radial-gradient(ellipse 50% 40% at 80% 80%, rgba(16,185,129,0.08) 0%, transparent 60%),
          radial-gradient(ellipse 30% 25% at 55% 95%, rgba(139,92,246,0.06) 0%, transparent 55%)
        `,
      }}
    >
      <div className="w-full max-w-sm">
        <BrandLogo />

        <LoginCard>
          <LoginForm
            email={email}
            pwd={pwd}
            errMsg={errMsg}
            loading={loading}
            onEmailChange={(v) => {
              setEmail(v)
              setErr('')
            }}
            onPwdChange={(v) => {
              setPwd(v)
              setErr('')
            }}
            onSubmit={handleSubmit}
          />
        </LoginCard>

        <p className="text-center text-slate-700 text-[11px] mt-4">
          DzDrop © {new Date().getFullYear()} — منصة التسويق بالعمولة
        </p>
      </div>

      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50%       { transform: translateY(-4px); }
        }
      `}</style>
    </div>
  )
}
