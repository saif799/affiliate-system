// ============================================================
// src/server/services/ecotrack.service.ts  — SERVER ONLY
//
// عميل HTTP لمنصّة التوصيل ECOTRACK (منصّة white-label؛ هذا الحساب = DHD).
// التوثيق الرسمي:
//   https://documenter.getpostman.com/view/14517169/Tz5je15g
//
// المصادقة: معامل استعلام  ?api_token=<token>  يُرفَق بكل طلب
//           (لا توجد ترويسة Authorization — تم التحقّق من ذلك مباشرةً مع الـ API).
// القاعدة:  {baseUrl}/api/v1/...    — baseUrl افتراضياً https://platform.dhd-dz.com
//
// مهم: نطاق dhd.ecotrack.dz يعيد توجيه 301 إلى platform.dhd-dz.com؛ متابعة 301
// تلقائياً تُحوّل POST إلى GET (فتفشل create/update/delete بـ 405). لذا:
//   1) القاعدة الافتراضية هي النطاق المُعتمَد مباشرةً، و
//   2) نتابع إعادة التوجيه يدويّاً مع الحفاظ على نفس HTTP method (دفاع إضافي).
//
// يجب ألّا يستورده أي مكوّن عميل — يستخدم fetch + قاعدة البيانات.
// ============================================================

import { db } from '#/server/db'
import { deliveryAccounts } from '#/server/db/schema'
import { and, eq, isNull } from 'drizzle-orm'

// ────────────────────────────────────────────────────────────
// الحالات الحقيقية لـ ECOTRACK (المصدر الموثوق لخريطة الحالات)
//
// نظامان للحالة في ECOTRACK:
//  1) رموز أحداث التتبّع  activity[].status  (من get/tracking/info)
//  2) حالة الطلبية على مستوى الحساب  status  (من get/orders)
// ────────────────────────────────────────────────────────────

/** رموز أحداث التتبّع الدقيقة (activity[].status) */
export type EcotrackActivity =
  | 'order_information_received_by_carrier'
  | 'picked'
  | 'accepted_by_carrier'
  | 'dispatched_to_driver'
  | 'attempt_delivery'
  | 'return_asked'
  | 'return_in_transit'
  | 'return_received'
  | 'livred'
  | 'encaissed'
  | 'payed'

/** حالات الطلبية على مستوى حساب المُرسِل (status في get/orders) */
export type EcotrackOrderStatus =
  | 'prete_a_expedier'
  | 'en_ramassage'
  | 'en_preparation_stock'
  | 'vers_hub'
  | 'en_hub'
  | 'vers_wilaya'
  | 'en_preparation'
  | 'en_livraison'
  | 'suspendu'
  | 'livre_non_encaisse'
  | 'encaisse_non_paye'
  | 'paiements_prets'
  | 'paye_et_archive'
  | 'retour_chez_livreur'
  | 'retour_transit_entrepot'
  | 'retour_en_traitement'
  | 'retour_recu'
  | 'retour_archive'
  | 'annule'

export type EcotrackStatus = EcotrackActivity | EcotrackOrderStatus

// التسميات العربية لكل الرموز (نشاط + حالة طلبية) — مفتاح واحد موحّد
export const ECOTRACK_STATUS_LABELS: Record<string, string> = {
  // ── رموز أحداث التتبّع ──
  order_information_received_by_carrier: 'تم تسجيل الطلب لدى الناقل',
  picked: 'استلمها الناقل',
  accepted_by_carrier: 'وصلت مركز الفرز',
  dispatched_to_driver: 'مع موزّع التسليم',
  attempt_delivery: 'محاولة تسليم',
  return_asked: 'طُلب الإرجاع',
  return_in_transit: 'الإرجاع في الطريق',
  return_received: 'تم استلام المُرتجَع',
  livred: 'تم التسليم',
  encaissed: 'تم تحصيل المبلغ',
  payed: 'تم الدفع',
  // ── حالات الطلبية ──
  prete_a_expedier: 'جاهزة للشحن',
  en_ramassage: 'قيد الاستلام',
  en_preparation_stock: 'قيد التحضير (مخزون)',
  vers_hub: 'في الطريق إلى المركز',
  en_hub: 'في مركز الفرز',
  vers_wilaya: 'في الطريق إلى الولاية',
  en_preparation: 'قيد التحضير',
  en_livraison: 'قيد التسليم',
  suspendu: 'موقوفة',
  livre_non_encaisse: 'سُلّمت (لم تُحصَّل)',
  encaisse_non_paye: 'حُصِّلت (لم تُدفع)',
  paiements_prets: 'الدفع جاهز',
  paye_et_archive: 'مدفوعة ومؤرشفة',
  retour_chez_livreur: 'مُرتجَعة لدى الموزّع',
  retour_transit_entrepot: 'مُرتجَعة في الطريق للمستودع',
  retour_en_traitement: 'مُرتجَعة قيد المعالجة',
  retour_recu: 'تم استلام المُرتجَع',
  retour_archive: 'مُرتجَعة مؤرشفة',
  annule: 'ملغاة',
}

/** التسمية العربية لحالة/حدث ECOTRACK الخام (تطبيع لحالة الأحرف + fallback آمن) */
export function ecotrackStatusLabel(raw: string): string {
  const key = typeof raw === 'string' ? raw.toLowerCase() : raw
  return ECOTRACK_STATUS_LABELS[key] ?? raw
}

// ────────────────────────────────────────────────────────────
// أنواع الحمولات والاستجابات (مطابقة للـ API الرسمي)
// ────────────────────────────────────────────────────────────

/** حمولة إنشاء شحنة — create/order (أسماء الحقول snake_case كما في التوثيق) */
export interface EcotrackCreateOrderPayload {
  reference?: string
  nom_client: string // اسم الزبون
  telephone: string // هاتف أساسي (9–10 أرقام)
  telephone_2?: string
  adresse: string
  code_postal?: string | number
  commune: string
  code_wilaya: number // 1..58
  montant: number // مبلغ COD (دينار)
  remarque?: string
  produit?: string
  stock?: 0 | 1
  quantite?: number // مطلوب عند stock=1
  produit_a_recuperer?: string
  boutique?: string
  type: 1 | 2 | 3 | 4 // 1=توصيل 2=استبدال 3=Pickup 4=تحصيل
  stop_desk: 0 | 1 // 0=منزلي 1=مكتب
  weight?: number
  fragile?: 0 | 1
  gps_link?: string
}

/**
 * حمولة تعديل شحنة — update/order.
 * ملاحظة مهمّة (مُتحقَّق منها مباشرةً مع الـ API):
 *  - أسماء حقول التعديل تختلف عن الإنشاء (client/tel/tel2/wilaya/product بدل
 *    nom_client/telephone/…/code_wilaya/produit).
 *  - التعديل ليس جزئيّاً: الـ API يفرض إرسال المجموعة الكاملة على الأقل
 *    (client, tel, adresse, commune, wilaya, montant, type) وإلا أعاد 422.
 */
export interface EcotrackUpdateOrderPayload {
  // مطلوبة (يفرضها الـ API)
  client: string
  tel: string
  adresse: string
  commune: string
  wilaya: number
  montant: number
  type: 1 | 2 | 3 | 4
  // اختيارية
  tel2?: string
  reference?: string
  code_postal?: string | number
  remarque?: string
  product?: string
  boutique?: string
  stop_desk?: 0 | 1
  fragile?: 0 | 1
  gps_link?: string
}

export interface EcotrackCreateOrderResponse {
  success: boolean
  tracking?: string
  error?: number
  message?: string
  [key: string]: unknown
}

export interface EcotrackSimpleResponse {
  success: boolean
  message?: string
  error?: number
  [key: string]: unknown
}

export interface EcotrackTrackingActivity {
  date: string
  time?: string
  status: string
  station?: string
  reason?: string
  details?: string
  content?: string
  driver?: string
  [key: string]: unknown
}

export interface EcotrackTrackingInfo {
  recipientName?: string
  shippedBy?: string
  originCity?: number
  destLocationCity?: number
  currentStation?: string
  activity?: EcotrackTrackingActivity[]
  [key: string]: unknown
}

export interface EcotrackFee {
  wilaya_id: number
  tarif: string
  tarif_stopdesk?: string
  [key: string]: unknown
}

export interface EcotrackWilaya {
  wilaya_id: number
  wilaya_name: string
}

export interface EcotrackCommune {
  nom: string
  wilaya_id: number
  code_postal: string
  has_stop_desk: 0 | 1
  [key: string]: unknown
}

export interface EcotrackOrdersPage {
  current_page: number
  data: Array<Record<string, unknown>>
  [key: string]: unknown
}

// ────────────────────────────────────────────────────────────
// خطأ مُصنّف
// ────────────────────────────────────────────────────────────

export class EcotrackApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly endpoint: string,
    /** رمز خطأ ECOTRACK التجاري (مثل 10002 = لا توصيل للولاية) إن وُجد */
    public readonly ecotrackError?: number,
  ) {
    super(message)
    this.name = 'EcotrackApiError'
  }
}

// ────────────────────────────────────────────────────────────
// الخدمة
// ────────────────────────────────────────────────────────────

const DEFAULT_BASE_URL = process.env.ECOTRACK_BASE_URL ?? 'https://platform.dhd-dz.com'

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

// تراجع أُسّي مع تشويش (jitter) — 250ms, 500ms, 1000ms… + 0–99ms
// يمنع «قطيع» إعادة المحاولات المتزامنة على الخادم نفسه.
function backoffDelay(attempt: number): number {
  return 250 * 2 ** attempt + Math.floor(Math.random() * 100)
}

type Params = Record<string, string | number | boolean | null | undefined>

export interface EcotrackServiceOptions {
  baseUrl?: string
  maxRetries?: number
}

export class EcotrackService {
  private readonly apiKey: string
  private readonly baseUrl: string
  private readonly maxRetries: number

  constructor(apiKey: string, opts: EcotrackServiceOptions = {}) {
    if (!apiKey) throw new Error('EcotrackService: apiKey مطلوب')
    this.apiKey = apiKey
    // طبّع القاعدة: scheme+host بلا شَرطة مائلة في النهاية ولا مسار /api
    this.baseUrl = (opts.baseUrl ?? DEFAULT_BASE_URL).replace(/\/+$/, '')
    this.maxRetries = opts.maxRetries ?? 2
  }

  /** يبني عنوان URL كاملاً لنقطة v1 مع api_token وبقيّة المعاملات */
  private buildUrl(endpoint: string, params?: Params): string {
    const qs = new URLSearchParams()
    qs.set('api_token', this.apiKey)
    if (params) {
      for (const [k, v] of Object.entries(params)) {
        if (v !== undefined && v !== null && v !== '') qs.set(k, String(v))
      }
    }
    return `${this.baseUrl}/api/v1/${endpoint.replace(/^\/+/, '')}?${qs.toString()}`
  }

  // متابعة إعادة التوجيه يدويّاً مع الحفاظ على نفس HTTP method.
  // (السلوك الافتراضي fetch يحوّل POST→GET عند 301/302 فتفشل عمليّات الكتابة.)
  private async fetchFollow(
    url: string,
    method: string,
    headers: Record<string, string>,
    maxHops = 3,
  ): Promise<Response> {
    let current = url
    for (let hop = 0; hop < maxHops; hop++) {
      const res = await fetch(current, { method, headers, redirect: 'manual' })
      if (res.status === 301 || res.status === 302 || res.status === 307 || res.status === 308) {
        const loc = res.headers?.get?.('location')
        if (loc) {
          current = new URL(loc, current).toString()
          continue
        }
      }
      return res
    }
    return fetch(current, { method, headers, redirect: 'manual' })
  }

  // طبقة HTTP الموحّدة — كل معاملات ECOTRACK تُمرَّر في سلسلة الاستعلام
  // (لا جسم JSON)، تماماً كما في التوثيق الرسمي.
  private async request<T>(method: string, endpoint: string, params?: Params): Promise<T> {
    const url = this.buildUrl(endpoint, params)
    let lastError: unknown

    for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
      try {
        const res = await this.fetchFollow(url, method, { Accept: 'application/json' })

        if (!res.ok) {
          const text = await res.text().catch(() => '')
          // 422 = خطأ تحقّق من الحقول (Laravel) — استخرج رسالة مفهومة
          if (res.status === 422) {
            throw new EcotrackApiError(422, parseValidationError(text), endpoint)
          }
          const err = new EcotrackApiError(res.status, text || res.statusText, endpoint)
          // أعِد المحاولة على أخطاء الخادم فقط (5xx)
          if (res.status >= 500 && attempt < this.maxRetries) {
            lastError = err
            await sleep(backoffDelay(attempt))
            continue
          }
          throw err
        }

        const raw = await res.text()
        const data = raw ? (JSON.parse(raw) as unknown) : {}

        // خطأ تجاري بحالة HTTP 200: { success:false, error, message }
        if (
          data &&
          typeof data === 'object' &&
          'success' in data &&
          (data as { success: unknown }).success === false
        ) {
          const d = data as { error?: number; message?: string }
          throw new EcotrackApiError(
            400, // <500 ⇒ لا إعادة محاولة
            d.message || `ECOTRACK خطأ ${d.error ?? ''}`.trim(),
            endpoint,
            d.error,
          )
        }

        return data as T
      } catch (err) {
        // أخطاء التطبيق (4xx/تجاري) لا تُعاد محاولتها
        if (err instanceof EcotrackApiError && err.status > 0 && err.status < 500) {
          throw err
        }
        lastError = err
        if (attempt < this.maxRetries) {
          await sleep(200 * (attempt + 1))
          continue
        }
      }
    }

    if (lastError instanceof EcotrackApiError) throw lastError
    throw new EcotrackApiError(
      0,
      lastError instanceof Error ? lastError.message : 'خطأ في الاتصال بـ ECOTRACK',
      endpoint,
    )
  }

  // ── المصادقة والإعدادات (قراءة فقط) ──────────────────────────

  /** التحقّق من صلاحية التوكن — GET validate/token */
  async validateToken(): Promise<boolean> {
    const r = await this.request<EcotrackSimpleResponse>('GET', 'validate/token')
    return r.success === true
  }

  /** قائمة الولايات المفعّلة — GET get/wilayas */
  getWilayas(): Promise<EcotrackWilaya[]> {
    return this.request<EcotrackWilaya[]>('GET', 'get/wilayas')
  }

  /** بلديات ولاية — GET get/communes?wilaya_id= */
  async getCommunes(wilayaId?: number): Promise<EcotrackCommune[]> {
    const r = await this.request<EcotrackCommune[] | Record<string, EcotrackCommune>>(
      'GET',
      'get/communes',
      wilayaId !== undefined ? { wilaya_id: wilayaId } : undefined,
    )
    // قد تأتي مصفوفة أو خريطة مفهرسة حسب النسخة — طبّعها لمصفوفة
    return Array.isArray(r) ? r : Object.values(r)
  }

  /** تعرفة التوصيل حسب الولاية — GET get/fees ⇒ { livraison:[…] } */
  async getFees(): Promise<EcotrackFee[]> {
    const r = await this.request<{ livraison?: EcotrackFee[] }>('GET', 'get/fees')
    return r.livraison ?? []
  }

  // ── الشحنات (كتابة) ─────────────────────────────────────────

  /** إنشاء شحنة جديدة — POST create/order */
  createOrder(payload: EcotrackCreateOrderPayload): Promise<EcotrackCreateOrderResponse> {
    return this.request<EcotrackCreateOrderResponse>(
      'POST',
      'create/order',
      payload as unknown as Params,
    )
  }

  /** تعديل شحنة قائمة — POST update/order?tracking= */
  updateOrder(
    tracking: string,
    payload: EcotrackUpdateOrderPayload,
  ): Promise<EcotrackSimpleResponse> {
    return this.request<EcotrackSimpleResponse>('POST', 'update/order', {
      tracking,
      ...(payload as unknown as Params),
    })
  }

  /** حذف شحنة (قبل التصديق) — DELETE delete/order?tracking= */
  async deleteOrder(tracking: string): Promise<EcotrackSimpleResponse> {
    // ECOTRACK يردّ عند النجاح { delete:"success" } لا { success:true } — نُطبّع الشكل
    const r = await this.request<Record<string, unknown>>('DELETE', 'delete/order', { tracking })
    return { ...r, success: r.delete === 'success' || r.success === true }
  }

  /** تصديق وشحن الطلبية (Expedier) — POST valid/order?tracking= */
  shipOrder(tracking: string, askCollection = false): Promise<EcotrackSimpleResponse> {
    return this.request<EcotrackSimpleResponse>('POST', 'valid/order', {
      tracking,
      ask_collection: askCollection ? 1 : undefined,
    })
  }

  /** طلب إرجاع شحنة — POST ask/for/order/return?tracking= (لا يقبل سبباً) */
  requestReturn(tracking: string): Promise<EcotrackSimpleResponse> {
    return this.request<EcotrackSimpleResponse>('POST', 'ask/for/order/return', { tracking })
  }

  /** إضافة ملاحظة/تحديث على شحنة — POST add/maj?tracking=&content= */
  addTrackingNote(tracking: string, content: string): Promise<EcotrackSimpleResponse> {
    return this.request<EcotrackSimpleResponse>('POST', 'add/maj', { tracking, content })
  }

  // ── التتبّع والاستعلام (قراءة) ───────────────────────────────

  /** سجلّ وحالة عمليّات شحنة — GET get/tracking/info?tracking= */
  getTrackingInfo(tracking: string): Promise<EcotrackTrackingInfo> {
    return this.request<EcotrackTrackingInfo>('GET', 'get/tracking/info', { tracking })
  }

  /** قائمة الطلبيات وحالاتها — GET get/orders */
  getOrders(opts: {
    page?: number
    startDate?: string
    endDate?: string
    tracking?: string
  } = {}): Promise<EcotrackOrdersPage> {
    return this.request<EcotrackOrdersPage>('GET', 'get/orders', {
      page: opts.page,
      start_date: opts.startDate,
      end_date: opts.endDate,
      tracking: opts.tracking,
    })
  }

  /** ملصق الشحن (PDF) — GET get/order/label?tracking= */
  async getLabel(tracking: string): Promise<{ type: 'pdf'; base64: string }> {
    const url = this.buildUrl('get/order/label', { tracking })
    const res = await this.fetchFollow(url, 'GET', { Accept: 'application/pdf' })
    if (!res.ok) {
      throw new EcotrackApiError(res.status, 'فشل جلب ملصق الشحن', 'get/order/label')
    }
    const buf = Buffer.from(await res.arrayBuffer())
    if (buf.length === 0) {
      throw new EcotrackApiError(502, 'ملصق شحن فارغ من ECOTRACK', 'get/order/label')
    }
    return { type: 'pdf', base64: buf.toString('base64') }
  }
}

// استخراج رسالة مقروءة من خطأ تحقّق Laravel { message, errors:{ field:[…] } }
function parseValidationError(text: string): string {
  try {
    const j = JSON.parse(text) as { message?: string; errors?: Record<string, string[]> }
    if (j.errors) {
      const msgs = Object.values(j.errors).flat()
      if (msgs.length) return msgs.join(' | ')
    }
    if (j.message) return j.message
  } catch {
    /* نصّ غير JSON */
  }
  return text || 'بيانات غير صالحة'
}

// ────────────────────────────────────────────────────────────
// المصنع (factory) — مع كاش حسب accountId
//
// ملاحظة: توقيع الـ spec متزامن، لكن قراءة المفتاح من DB غير متزامنة،
// لذا نُرجِع Promise (انحراف ضروري لا مفرّ منه).
// ────────────────────────────────────────────────────────────

const clientCache = new Map<string, EcotrackService>()
const ENV_CACHE_KEY = '__env__'

export async function getEcotrackClient(accountId?: string): Promise<EcotrackService> {
  const cacheKey = accountId ?? ENV_CACHE_KEY
  const cached = clientCache.get(cacheKey)
  if (cached) return cached

  let apiKey: string | undefined
  let baseUrl: string | undefined

  if (accountId) {
    const [acct] = await db
      .select({
        apiKey: deliveryAccounts.api_key,
        baseUrl: deliveryAccounts.base_url,
        isActive: deliveryAccounts.is_active,
      })
      .from(deliveryAccounts)
      .where(and(eq(deliveryAccounts.id, accountId), isNull(deliveryAccounts.deleted_at)))
      .limit(1)

    if (!acct) throw new Error(`getEcotrackClient: حساب التوصيل غير موجود — ${accountId}`)
    if (!acct.isActive) throw new Error('getEcotrackClient: حساب التوصيل معطّل')
    apiKey = acct.apiKey
    baseUrl = acct.baseUrl ?? undefined
  } else {
    apiKey = process.env.API_DHD
  }

  if (!apiKey) {
    throw new Error('getEcotrackClient: لا يوجد مفتاح API (لا accountId ولا API_DHD)')
  }

  const client = new EcotrackService(apiKey, { baseUrl })
  clientCache.set(cacheKey, client)
  return client
}

/** إبطال كاش العميل بعد تعديل/حذف حساب توصيل (يُستدعى من دوال إدارة الحسابات) */
export function invalidateEcotrackClient(accountId?: string): void {
  clientCache.delete(accountId ?? ENV_CACHE_KEY)
}
