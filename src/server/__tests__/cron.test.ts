import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { checkCronSecret } from '#/server/cron'

// مصادقة المهام المجدولة (/api/cron/*) — تثبّت سلوك checkCronSecret:
// 503 إن غاب CRON_SECRET، 401 عند عدم التطابق، null (مرور) عند التطابق.

const SECRET = 'super-secret-cron-value-1234567890'

function reqWith(header?: string): Request {
  return new Request('http://localhost/api/cron/x', {
    method: 'POST',
    headers: header === undefined ? {} : { 'x-cron-secret': header },
  })
}

describe('checkCronSecret — حارس المهام المجدولة', () => {
  let original: string | undefined

  beforeEach(() => {
    original = process.env.CRON_SECRET
  })
  afterEach(() => {
    if (original === undefined) delete process.env.CRON_SECRET
    else process.env.CRON_SECRET = original
  })

  it('يُعطّل النقطة (503) عندما لا يُضبط CRON_SECRET', () => {
    delete process.env.CRON_SECRET
    const res = checkCronSecret(reqWith(SECRET))
    expect(res).not.toBeNull()
    expect(res!.status).toBe(503)
  })

  it('يرفض (401) عند غياب ترويسة x-cron-secret', () => {
    process.env.CRON_SECRET = SECRET
    const res = checkCronSecret(reqWith())
    expect(res!.status).toBe(401)
  })

  it('يرفض (401) عند سرّ غير مطابق', () => {
    process.env.CRON_SECRET = SECRET
    const res = checkCronSecret(reqWith('wrong-secret'))
    expect(res!.status).toBe(401)
  })

  it('يرفض (401) عند سرّ بطول مختلف (شرط timingSafeEqual)', () => {
    process.env.CRON_SECRET = SECRET
    const res = checkCronSecret(reqWith(SECRET + 'x'))
    expect(res!.status).toBe(401)
  })

  it('يمرّر (null) عند تطابق السرّ تماماً', () => {
    process.env.CRON_SECRET = SECRET
    const res = checkCronSecret(reqWith(SECRET))
    expect(res).toBeNull()
  })
})
