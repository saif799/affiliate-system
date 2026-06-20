import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from './schema'

// ── عميل قاعدة البيانات (Neon) لبيئة Vercel serverless ──────────────────
//
// خلفية العطل: كان تسجيل الدخول «يتجمّد» للأبد (لا خطأ، فقط دوران). السبب أنّ
// كل استدعاء serverless على Vercel يُنشئ بركة اتصالات (pool) خاصّة به مباشرةً
// إلى نقطة Neon *غير المجمّعة* (non-pooled). تحت أيّ تزامن تتراكم عشرات النُسخ
// × عدّة اتصالات لكلٍّ منها فتتجاوز سقف اتصالات Neon. عندئذٍ:
//   • Neon ترفض اتصالات جديدة، و
//   • postgres-js يضع الاستعلامات في طابور انتظار اتصالٍ حُرّ *بلا مهلة*،
// فالاستعلام لا يفشل ولا ينجح ⇒ تجمّد لا نهائي (وليس خطأً). هذا مستقلّ تماماً
// عن قيد I/O القديم في Cloudflare Workers.
//
// الإصلاح يتطلّب جزأين:
//  (1) كود (هنا): تهيئة آمنة لِـ serverless.
//      - max صغير: نمنع «عاصفة اتصالات» من كل نسخة Lambda.
//      - prepare:false: *إلزامي* عند المرور بمجمّع Neon (PgBouncer بوضع
//        transaction) لأنّ العبارات المُحضَّرة لا تُدعَم هناك؛ وهو آمن أيضاً
//        على النقطة المباشرة. transactions تبقى تعمل بشكل سليم.
//      - connect_timeout/idle_timeout/max_lifetime: نُفشل بسرعة عند تعذّر
//        الاتصال بدل التجمّد، ونُدوّر الاتصالات قبل أن «تموت» أثناء تجميد Lambda.
//  (2) إعداد على Vercel (يجب فعله يدوياً): اجعل DATABASE_URL يستخدم نقطة Neon
//      *المجمّعة* — أي المضيف الذي يحوي «-pooler» (مثال:
//      ep-wispy-hill-alflx6r3-pooler.c-3.eu-central-1.aws.neon.tech). عندها
//      يُوزِّع PgBouncer مئات اتصالات العملاء على عددٍ قليل من اتصالات Postgres
//      فلا يُستنفَد السقف أبداً.
const connectionString = process.env.DATABASE_URL
if (!connectionString) {
  // فشل سريع وواضح بدل تجمّد غامض إذا لم تُضبط المتغيّرات على Vercel.
  throw new Error(
    'DATABASE_URL غير مضبوط — اضبطه في إعدادات مشروع Vercel (Environment Variables).',
  )
}

// تنبيه (لا يُوقف التشغيل) إن كانت السلسلة تشير إلى النقطة المباشرة بدل المجمّعة.
if (
  process.env.NODE_ENV === 'production' &&
  !/-pooler\./.test(connectionString)
) {
  console.warn(
    '[db] DATABASE_URL يبدو أنّه يستخدم نقطة Neon المباشرة (بلا «-pooler»). ' +
      'على Vercel استخدم النقطة المجمّعة (pooler) لتفادي استنفاد الاتصالات والتجمّد.',
  )
}

const client = postgres(connectionString, {
  max: 5, // بركة صغيرة لكل نسخة serverless (المجمّع يتكفّل بالباقي)
  prepare: false, // إلزامي مع PgBouncer (وضع transaction)، وآمن دائماً
  connect_timeout: 15, // نفشل بدل التجمّد إذا تأخّر الاتصال
  idle_timeout: 20, // نُغلق الاتصالات الخاملة
  max_lifetime: 60 * 30, // نُدوّر الاتصالات دوريّاً
})
export const db = drizzle(client, { schema })
