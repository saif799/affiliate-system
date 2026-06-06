// ============================================================
// src/server/services/ecotrack.service.ts  — SERVER ONLY
//
// عميل HTTP لشركة التوصيل ECOTRACK (app.ecotrack.dz).
// التوثيق: https://documenter.getpostman.com/view/14517169/Tz5je15g
// المصادقة: ترويسة  Authorization: Token <apiKey>
//
// يجب ألّا يستورده أي مكوّن عميل — يستخدم fetch + قاعدة البيانات.
// ============================================================

import { db } from '#/server/db'
import { deliveryAccounts } from '#/server/db/schema'
import { and, eq, isNull } from 'drizzle-orm'

// ────────────────────────────────────────────────────────────
// الحالات (Français → عربية) — المصدر الموثوق لخريطة الحالات
// ────────────────────────────────────────────────────────────

export type EcotrackStatus =
  | 'en_attente'
  | 'pris_en_charge'
  | 'en_transit'
  | 'en_cours_livraison'
  | 'livre'
  | 'retourne'
  | 'retourne_paye'
  | 'echec_livraison'
  | 'annule'

export const ECOTRACK_STATUS_LABELS: Record<EcotrackStatus, string> = {
  en_attente: 'في الانتظار',
  pris_en_charge: 'تم الاستلام',
  en_transit: 'في الطريق',
  en_cours_livraison: 'جاري التسليم',
  livre: 'تم التسليم',
  retourne: 'مسترجعة',
  retourne_paye: 'مسترجعة مدفوعة',
  echec_livraison: 'فشل التسليم',
  annule: 'ملغى',
}

/** التسمية العربية لحالة ECOTRACK الخام (مع fallback آمن) */
export function ecotrackStatusLabel(raw: string): string {
  return ECOTRACK_STATUS_LABELS[raw as EcotrackStatus] ?? raw
}

// ────────────────────────────────────────────────────────────
// أنواع الحمولات والاستجابات
// ────────────────────────────────────────────────────────────

export interface EcotrackCreateOrderPayload {
  Tracking?: string // اختياري — ECOTRACK يولّده إن تُرك فارغاً
  Client: string // اسم الزبون
  MobileA: string // هاتف الزبون الأساسي
  MobileB?: string // هاتف ثانوي
  Adresse: string
  IDWilaya: number
  Commune: string
  Total: number // مبلغ COD (دينار، عدد صحيح)
  TProduit: string // وصف المنتج
  Note?: string
  TypeLivraison: 0 | 1 // 0 = توصيل منزلي، 1 = مكتب (stopdesk)
  TypeColis: 0 | 1 // 0 = عادي، 1 = مع استبدال (échange)
  Confrimee: 0 | 1 // مؤكَّدة (تهجئة ECOTRACK الرسمية)
}

export interface EcotrackCreateOrderResponse {
  tracking: string
  success?: boolean
  message?: string
  [key: string]: unknown
}

// شكل ECOTRACK غير موثّق بالكامل → نُصرّح بالحقول المعروفة ونترك مؤشّراً
// آمناً (unknown، وليس any) لبقيّة الحقول.
export interface EcotrackOrderResponse {
  tracking?: string
  status?: string
  client?: string
  total?: number
  wilaya?: string
  commune?: string
  [key: string]: unknown
}

export interface EcotrackTrackingActivity {
  status: string
  date: string
  comment?: string
  wilaya?: string
  [key: string]: unknown
}

export interface EcotrackTrackingResponse {
  tracking?: string
  activities?: EcotrackTrackingActivity[]
  [key: string]: unknown
}

export interface EcotrackReturnResponse {
  success: boolean
  message?: string
  [key: string]: unknown
}

export interface EcotrackRate {
  wilaya_id: number
  wilaya: string
  tarif: number
  tarif_stopdesk?: number
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
  ) {
    super(message)
    this.name = 'EcotrackApiError'
  }
}

// ────────────────────────────────────────────────────────────
// الخدمة
// ────────────────────────────────────────────────────────────

const DEFAULT_BASE_URL = process.env.ECOTRACK_BASE_URL ?? 'https://app.ecotrack.dz/api/'

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

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
    // اضمن انتهاء العنوان بشَرطة مائلة لتعمل عناوين URL النسبية
    this.baseUrl = (opts.baseUrl ?? DEFAULT_BASE_URL).replace(/\/?$/, '/')
    this.maxRetries = opts.maxRetries ?? 2
  }

  // طبقة HTTP الموحّدة: تتعامل مع الأخطاء وتُعيد المحاولة على 5xx/الشبكة
  private async request<T>(method: string, endpoint: string, body?: unknown): Promise<T> {
    const url = new URL(endpoint.replace(/^\//, ''), this.baseUrl).toString()
    let lastError: unknown

    for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
      try {
        const res = await fetch(url, {
          method,
          headers: {
            Authorization: `Token ${this.apiKey}`,
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
          body: body !== undefined ? JSON.stringify(body) : undefined,
        })

        if (!res.ok) {
          const text = await res.text().catch(() => '')
          const err = new EcotrackApiError(res.status, text || res.statusText, endpoint)
          // أعِد المحاولة على أخطاء الخادم فقط (5xx)
          if (res.status >= 500 && attempt < this.maxRetries) {
            lastError = err
            await sleep(200 * (attempt + 1))
            continue
          }
          throw err
        }

        const raw = await res.text()
        return (raw ? (JSON.parse(raw) as T) : ({} as T))
      } catch (err) {
        // أخطاء 4xx لا تُعاد محاولتها
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

  /** إنشاء شحنة جديدة */
  createOrder(payload: EcotrackCreateOrderPayload): Promise<EcotrackCreateOrderResponse> {
    return this.request<EcotrackCreateOrderResponse>('POST', 'commande/', payload)
  }

  /** تفاصيل شحنة + حالتها الحالية */
  getOrder(tracking: string): Promise<EcotrackOrderResponse> {
    return this.request<EcotrackOrderResponse>(
      'GET',
      `commande/${encodeURIComponent(tracking)}/`,
    )
  }

  /** سجلّ التتبّع الكامل (كل تغيّرات الحالة مع التواريخ) */
  getTracking(tracking: string): Promise<EcotrackTrackingResponse> {
    return this.request<EcotrackTrackingResponse>(
      'GET',
      `commande/${encodeURIComponent(tracking)}/tracking/`,
    )
  }

  /** تحديث شحنة قائمة */
  updateOrder(
    tracking: string,
    payload: Partial<EcotrackCreateOrderPayload>,
  ): Promise<EcotrackOrderResponse> {
    return this.request<EcotrackOrderResponse>(
      'PUT',
      `commande/${encodeURIComponent(tracking)}/`,
      payload,
    )
  }

  /** طلب استرجاع/إرجاع طرد */
  requestReturn(tracking: string, reason: string): Promise<EcotrackReturnResponse> {
    return this.request<EcotrackReturnResponse>('POST', 'retour/', {
      Tracking: tracking,
      Raison: reason,
    })
  }

  /** أسعار التوصيل حسب الولاية */
  getRates(wilayaId?: number): Promise<EcotrackRate[]> {
    const endpoint =
      wilayaId !== undefined ? `tarif/?wilaya=${encodeURIComponent(wilayaId)}` : 'tarif/'
    return this.request<EcotrackRate[]>('GET', endpoint)
  }
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

  if (accountId) {
    const [acct] = await db
      .select({
        apiKey: deliveryAccounts.api_key,
        isActive: deliveryAccounts.is_active,
      })
      .from(deliveryAccounts)
      .where(and(eq(deliveryAccounts.id, accountId), isNull(deliveryAccounts.deleted_at)))
      .limit(1)

    if (!acct) throw new Error(`getEcotrackClient: حساب التوصيل غير موجود — ${accountId}`)
    if (!acct.isActive) throw new Error('getEcotrackClient: حساب التوصيل معطّل')
    apiKey = acct.apiKey
  } else {
    apiKey = process.env.API_DHD
  }

  if (!apiKey) {
    throw new Error('getEcotrackClient: لا يوجد مفتاح API (لا accountId ولا API_DHD)')
  }

  const client = new EcotrackService(apiKey)
  clientCache.set(cacheKey, client)
  return client
}

/** إبطال كاش العميل بعد تعديل/حذف حساب توصيل (يُستدعى من دوال إدارة الحسابات) */
export function invalidateEcotrackClient(accountId?: string): void {
  clientCache.delete(accountId ?? ENV_CACHE_KEY)
}
