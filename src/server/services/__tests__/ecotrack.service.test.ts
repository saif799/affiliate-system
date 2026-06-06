import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

import {
  EcotrackService,
  EcotrackApiError,
  getEcotrackClient,
  invalidateEcotrackClient,
} from '#/server/services/ecotrack.service'

// عميل DB وهمي — الكلاس ومسار env في المصنع لا يلمسان قاعدة البيانات
vi.mock('#/server/db', () => ({ db: {} }))

type FetchInit = { method?: string; headers?: Record<string, string> }

function makeResponse(status: number, body: string): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    statusText: `HTTP ${status}`,
    text: async () => body,
  } as unknown as Response
}

const BASE = 'https://dhd.ecotrack.dz'

describe('EcotrackService', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  it('getFees() ينادي get/fees بـ api_token في الاستعلام ويحلّل { livraison }', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(
        makeResponse(200, '{"livraison":[{"wilaya_id":16,"tarif":"500","tarif_stopdesk":"300"}]}'),
      )
    vi.stubGlobal('fetch', fetchMock)

    const svc = new EcotrackService('KEY123', { baseUrl: BASE })
    const fees = await svc.getFees()

    expect(fees).toHaveLength(1)
    expect(fees[0].wilaya_id).toBe(16)
    const [url, init] = fetchMock.mock.calls[0] as [string, FetchInit]
    expect(url).toBe(`${BASE}/api/v1/get/fees?api_token=KEY123`)
    expect(init.method).toBe('GET')
    // لا ترويسة Authorization إطلاقاً — المصادقة عبر الاستعلام فقط
    expect(init.headers?.Authorization).toBeUndefined()
  })

  it('validateToken() يُرجِع true عند success:true', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(makeResponse(200, '{"success":true,"message":"VALID_TOKEN"}'))
    vi.stubGlobal('fetch', fetchMock)

    const svc = new EcotrackService('K', { baseUrl: BASE })
    await expect(svc.validateToken()).resolves.toBe(true)
    const [url] = fetchMock.mock.calls[0] as [string]
    expect(url).toBe(`${BASE}/api/v1/validate/token?api_token=K`)
  })

  it('createOrder() يرسل POST إلى create/order بالحقول snake_case في الاستعلام', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(makeResponse(200, '{"success":true,"tracking":"DHD-1"}'))
    vi.stubGlobal('fetch', fetchMock)

    const svc = new EcotrackService('K', { baseUrl: BASE })
    const r = await svc.createOrder({
      nom_client: 'عمر',
      telephone: '0550000000',
      adresse: 'حي السلام',
      commune: 'بئر مراد رايس',
      code_wilaya: 16,
      montant: 4500,
      produit: 'حقيبة',
      type: 1,
      stop_desk: 0,
    })

    expect(r.tracking).toBe('DHD-1')
    const [url, init] = fetchMock.mock.calls[0] as [string, FetchInit]
    expect(init.method).toBe('POST')
    expect(url).toContain(`${BASE}/api/v1/create/order?`)
    expect(url).toContain('api_token=K')
    expect(url).toContain('nom_client=')
    expect(url).toContain('code_wilaya=16')
    expect(url).toContain('type=1')
  })

  it('يرمي EcotrackApiError على خطأ تجاري (success:false) بحالة HTTP 200', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(
        makeResponse(200, '{"success":false,"error":10002,"message":"Pas de livraison"}'),
      )
    vi.stubGlobal('fetch', fetchMock)

    const svc = new EcotrackService('K', { baseUrl: BASE })
    await expect(
      svc.createOrder({
        nom_client: 'x',
        telephone: '0550000000',
        adresse: 'a',
        commune: 'c',
        code_wilaya: 99,
        montant: 1,
        type: 1,
        stop_desk: 0,
      }),
    ).rejects.toMatchObject({ name: 'EcotrackApiError', ecotrackError: 10002 })
    expect(fetchMock).toHaveBeenCalledTimes(1) // لا إعادة محاولة لخطأ تجاري
  })

  it('يحوّل خطأ تحقّق 422 إلى رسالة مقروءة دون إعادة محاولة', async () => {
    const body =
      '{"message":"The given data was invalid.","errors":{"nom_client":["Le champ nom client est obligatoire."]}}'
    const fetchMock = vi.fn().mockResolvedValue(makeResponse(422, body))
    vi.stubGlobal('fetch', fetchMock)

    const svc = new EcotrackService('K', { baseUrl: BASE })
    await expect(svc.getWilayas()).rejects.toMatchObject({
      name: 'EcotrackApiError',
      status: 422,
      message: 'Le champ nom client est obligatoire.',
    })
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it('يُعيد المحاولة على 5xx ثم ينجح', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(makeResponse(500, 'err'))
      .mockResolvedValueOnce(makeResponse(503, 'err'))
      .mockResolvedValueOnce(makeResponse(200, '{"success":true,"message":"VALID_TOKEN"}'))
    vi.stubGlobal('fetch', fetchMock)

    const svc = new EcotrackService('K', { baseUrl: BASE, maxRetries: 2 })
    await expect(svc.validateToken()).resolves.toBe(true)
    expect(fetchMock).toHaveBeenCalledTimes(3)
  })

  it('يُعيد المحاولة على خطأ الشبكة ثم يرمي EcotrackApiError', async () => {
    const fetchMock = vi.fn().mockRejectedValue(new Error('ECONNRESET'))
    vi.stubGlobal('fetch', fetchMock)

    const svc = new EcotrackService('K', { baseUrl: BASE, maxRetries: 1 })
    await expect(svc.getFees()).rejects.toBeInstanceOf(EcotrackApiError)
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
