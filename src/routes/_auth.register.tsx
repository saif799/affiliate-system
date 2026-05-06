import { createFileRoute } from '@tanstack/react-router'
import { useState, useEffect } from 'react'
import { signUp } from '../lib/auth-client'

import type { Role, Step, State } from './-components/register/types/register.types'
import { ProgressBar }    from './-components/register/components/ProgressBar'
import { StepIndicator }  from './-components/register/components/StepIndicator'
import { Step1RoleSelect } from './-components/register/components/Step1RoleSelect'
import { Step2UserInfo }  from './-components/register/components/Step2UserInfo'
import { Step3Password }  from './-components/register/components/Step3Password'
import { SuccessScreen }  from './-components/register/components/SuccessScreen'

export const Route = createFileRoute('/_auth/register')({
  component: RegisterPage,
})

function RegisterPage() {
  const [step,    setStep]   = useState<Step>(1)
  const [role,    setRole]   = useState<Role | null>(null)
  const [name,    setName]   = useState('')
  const [email,   setEmail]  = useState('')
  const [phone,   setPhone]  = useState('')
  const [pwd,     setPwd]    = useState('')
  const [conf,    setConf]   = useState('')
  const [state,   setState]  = useState<State>('idle')
  const [errMsg,  setErr]    = useState('')
  const [animate, setAnimate] = useState(true)

  const isLoading = state === 'loading'

  useEffect(() => {
    setAnimate(false)
    const t = setTimeout(() => setAnimate(true), 30)
    return () => clearTimeout(t)
  }, [step])

  const goToStep = (s: Step) => { setErr(''); setStep(s) }

  const validateStep2 = (): boolean => {
    if (!name.trim())         { setErr('يرجى إدخال الاسم الكامل');      return false }
    if (!email.includes('@')) { setErr('البريد الإلكتروني غير صالح'); return false }
    return true
  }

  const validateStep3 = (): boolean => {
    if (pwd.length < 8) { setErr('كلمة المرور يجب أن تكون 8 أحرف على الأقل'); return false }
    if (pwd !== conf)   { setErr('كلمتا المرور غير متطابقتين');               return false }
    return true
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErr('')
    if (!validateStep3()) return
    setState('loading')

    const { error } = await signUp.email({
      name, email, password: pwd, role: role!,
      ...(phone ? { phone } : {}),
    } as any)

    if (error) {
      setErr(
        error.message === 'User already exists'
          ? 'البريد الإلكتروني مسجّل مسبقاً'
          : (error.message ?? 'حدث خطأ أثناء التسجيل'),
      )
      setState('error')
      return
    }

    setState('success')
  }

  if (state === 'success') return <SuccessScreen />

  const stepTitles = {
    1: { title: 'من أنت؟',             sub: 'اختر نوع حسابك للبدء' },
    2: { title: 'معلوماتك الأساسية',   sub: 'سيُستخدم هذا لإعداد حسابك' },
    3: { title: 'اختر كلمة مرور',      sub: 'يجب أن تكون 8 أحرف على الأقل' },
  }

  return (
    <div
      dir="rtl"
      className="min-h-screen flex items-start justify-center bg-[#080C14] px-4 py-8 overflow-y-auto auth-scroll"
      style={{
        backgroundImage: `
          radial-gradient(ellipse 60% 40% at 30% 10%, rgba(99,102,241,0.12) 0%, transparent 60%),
          radial-gradient(ellipse 40% 30% at 80% 80%, rgba(16,185,129,0.07) 0%, transparent 60%)
        `,
      }}
    >
      <div className="w-full max-w-sm">

        {/* شعار */}
        <div className="text-center mb-6" style={{ animation: 'fadeUp 0.4s ease both' }}>
          <div className="inline-flex items-center gap-2 mb-1">
            <div className="w-7 h-7 rounded-lg bg-linear-to-br from-indigo-500 to-violet-600 flex items-center justify-center">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2">
                <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
              </svg>
            </div>
            <span className="text-white font-bold text-lg tracking-tight">DzDrop</span>
          </div>
          <p className="text-slate-600 text-xs">منصة التسويق بالعمولة</p>
        </div>

        {/* البطاقة */}
        <div
          className="bg-[#0E1420] border border-white/[0.07] rounded-2xl shadow-2xl overflow-hidden"
          style={{ animation: 'fadeUp 0.5s ease 0.05s both' }}
        >
          <ProgressBar step={step} />

          <div className="px-5 pt-4 pb-0">
            <StepIndicator step={step} />

            {/* عنوان الخطوة */}
            <div
              className="mb-5"
              key={`title-${step}`}
              style={{ animation: animate ? 'fadeUp 0.3s ease both' : 'none' }}
            >
              <h2 className="text-white text-lg font-bold">{stepTitles[step].title}</h2>
              <p className="text-slate-500 text-xs mt-0.5">{stepTitles[step].sub}</p>
            </div>
          </div>

          {/* محتوى الخطوات */}
          <div
            className="px-5 pb-5"
            key={`body-${step}`}
            style={{ animation: animate ? 'fadeUp 0.35s ease 0.06s both' : 'none' }}
          >
            {step === 1 && (
              <Step1RoleSelect
                role={role}
                onSelectRole={setRole}
                onNext={() => goToStep(2)}
                goToStep={goToStep}
              />
            )}

            {step === 2 && (
              <Step2UserInfo
                name={name}
                email={email}
                phone={phone}
                errMsg={errMsg}
                isLoading={isLoading}
                onNameChange={setName}
                onEmailChange={setEmail}
                onPhoneChange={setPhone}
                onBack={() => goToStep(1)}
                onNext={() => { if (validateStep2()) goToStep(3) }}
              />
            )}

            {step === 3 && (
              <Step3Password
                name={name}
                email={email}
                role={role}
                pwd={pwd}
                conf={conf}
                errMsg={errMsg}
                isLoading={isLoading}
                onPwdChange={setPwd}
                onConfChange={setConf}
                onBack={() => goToStep(2)}
                onSubmit={handleSubmit}
              />
            )}
          </div>
        </div>

        <p className="text-center text-slate-700 text-[11px] mt-4">
          DzDrop © {new Date().getFullYear()} — منصة التسويق بالعمولة
        </p>
      </div>

      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  )
}