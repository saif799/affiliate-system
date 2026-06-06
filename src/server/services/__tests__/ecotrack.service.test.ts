import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

import {
  EcotrackService,
  EcotrackApiError,
  getEcotrackClient,
  invalidateEcotrackClient,
} from '#/server/services/ecotrack.service'

// عميل DB وهمي — الكلاس ومسار env في المصنع لا يلمسان قاعدة البيانات
vi.mock('#/server/db', () => ({ db: {} }))

type FetchInit = { method?: string; headers?: Record<string, string>; body?: string }

function makeResponse(status: number, body: string): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    statusText: `HTTP ${status}`,
    text: async () => body,
  } as unknown as Response
}

describe('EcotrackService', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  it('getRates() يستدعي العنوان الصحيح بترويسة Token ويحلّل JSON', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(makeResponse(200, '[{"wilaya_id":16,"wilaya":"الجزائر","tarif":500}]'))
    vi.stubGlobal('fetch', fetchMock)

    const svc = new EcotrackService('KEY123')
    const rates = await svc.getRates()

    expect(rates[0].wilaya).toBe('الجزائر')
    const [url, init] = fetchMock.mock.calls[0] as [string, FetchInit]
    expect(url).toBe('https://app.ecotrack.dz/api/tarif/')
    expect(init.headers?.Authorization).toBe('Token KEY123')
  })

  it('createOrder() يرسل POST إلى commande/', async () => {
    const fetchMock = vi.fn().mockResolvedValue(makeResponse(200, '{"tracking":"DZ-1","success":true}'))
    vi.stubGlobal('fetch', fetchMock)

    const svc = new EcotrackService('K')
    const r = await svc.createOrder({
      Client: 'عمر',
      MobileA: '0550000000',
      Adresse: 'حي السلام',
      IDWilaya: 16,
      Commune: 'بئر مراد رايس',
      Total: 4500,
      TProduit: 'حقيبة',
      TypeLivraison: 0,
      TypeColis: 0,
      Confrimee: 1,
    })

    expect(r.tracking).toBe('DZ-1')
    const [url, init] = fetchMock.mock.calls[0] as [string, FetchInit]
    expect(url).toBe('https://app.ecotrack.dz/api/commande/')
    expect(init.method).toBe('POST')
  })

  it('يرمي EcotrackApiError عند 4xx دون إعادة محاولة', async () => {
    const fetchMock = vi.fn().mockResolvedValue(makeResponse(400, 'bad request'))
    vi.stubGlobal('fetch', fetchMock)

    const svc = new EcotrackService('K')
    await expect(svc.getOrder('X')).rejects.toMatchObject({
      name: 'EcotrackApiError',
      status: 400,
    })
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it('يُعيد المحاولة على 5xx ثم ينجح', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(makeResponse(500, 'err'))
      .mockResolvedValueOnce(makeResponse(503, 'err'))
      .mockResolvedValueOnce(makeResponse(200, '{"tracking":"DZ-9"}'))
    vi.stubGlobal('fetch', fetchMock)

    const svc = new EcotrackService('K', { maxRetries: 2 })
    const r = await svc.getOrder('DZ-9')

    expect(r.tracking).toBe('DZ-9')
    expect(fetchMock).toHaveBeenCalledTimes(3)
  })

  it('يُعيد المحاولة على خطأ الشبكة ثم يرمي EcotrackApiError', async () => {
    const fetchMock = vi.fn().mockRejectedValue(new Error('ECONNRESET'))
    vi.stubGlobal('fetch', fetchMock)

    const svc = new EcotrackService('K', { maxRetries: 1 })
    await expect(svc.getRates()).rejects.toBeInstanceOf(EcotrackApiError)
    expect(fetchMock).toHaveBeenCalledTimes(2) // محاولة + إعادة واحدة
  })
})

describe('getEcotrackClient (المصنع)', () => {
  beforeEach(() => {
    invalidateEcotrackClient()
  })
  afterEach(() => {
    delete process.env.API_DHD
    invalidateEcotrackClient()
  })

  it('يرجع إلى API_DHD ويُخزّن النسخة في الكاش', async () => {
    process.env.API_DHD = 'ENVKEY'
    const a = await getEcotrackClient()
    const b = await getEcotrackClient()
    expect(a).toBeInstanceOf(EcotrackService)
    expect(a).toBe(b) // نفس النسخة (كاش)
  })

  it('يرمي عند غياب accountId و API_DHD معاً', async () => {
    delete process.env.API_DHD
    invalidateEcotrackClient()
    await expect(getEcotrackClient()).rejects.toThrow(/API_DHD/)
  })
})
