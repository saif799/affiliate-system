import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from './schema'

// إعدادات متينة مع Neon (خادم serverless قد «ينام» فيتأخّر أوّل اتصال):
//  - connect_timeout 30s: نمنح Neon وقتاً للاستيقاظ بدل فشل فوري.
//  - idle_timeout: نُغلق الاتصالات الخاملة بدل إبقائها فتنقطع فجأة.
//  - max_lifetime: نُدوّر الاتصالات دوريّاً (يتجنّب اتصالات «ميّتة»).
const client = postgres(process.env.DATABASE_URL!, {
  max: 10,
  connect_timeout: 30,
  idle_timeout: 20,
  max_lifetime: 60 * 30,
})
export const db = drizzle(client, { schema })