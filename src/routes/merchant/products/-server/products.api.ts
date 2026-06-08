// merchant/products/-server/products.api.ts

import { createServerFn } from '@tanstack/react-start'
import { db } from '#/server/db'
import { requireMerchant } from '#/server/auth/guards'
import { products } from '#/server/db/schema'
import { and, eq, isNull, sql, desc } from 'drizzle-orm'
import { z } from 'zod'
import { saveImage } from '#/server/storage'
import type {
  MerchantProductsData,
  Product,
  ProductCategory,
} from '../-products.types'

// ============================================================
// HELPERS
// ============================================================

const KNOWN_CATEGORIES: ProductCategory[] = [
  'أحذية',
  'ملابس',
  'حقائب',
  'إلكترونيات',
  'أخرى',
]

function toCategory(value: string | null): ProductCategory {
  return value && (KNOWN_CATEGORIES as string[]).includes(value)
    ? (value as ProductCategory)
    : 'أخرى'
}

const n = (v: unknown) => Number(v ?? 0)

// ============================================================
// IMAGE UPLOAD
// ============================================================

export const uploadProductImages = createServerFn({ method: 'POST' })
  .inputValidator((input: unknown) => {
    if (!(input instanceof FormData)) throw new Error('بيانات غير صالحة')
    return input
  })
  .handler(async ({ data }): Promise<{ urls: string[] }> => {
    await requireMerchant()
    const files = data
      .getAll('images')
      .filter((f): f is File => f instanceof File)

    if (files.length > 5) throw new Error('الحد الأقصى 5 صور')

    // التخزين معزول خلف saveImage — يدعم القرص المحلي والسحابي (STORAGE_DRIVER)
    const urls: string[] = []
    for (const file of files) {
      urls.push(await saveImage(file))
    }

    return { urls }
  })

// ============================================================
// GET PRODUCTS
// ============================================================

export const getMerchantProducts = createServerFn({ method: 'GET' }).handler(
  async (): Promise<MerchantProductsData> => {
    const { profileId } = await requireMerchant()

    const rows = await db
      .select({
        id: products.id,
        name: products.name,
        category: products.category,
        thumbnailUrl: products.thumbnail_url,
        imageUrls: products.image_urls,
        stockQty: products.stock_qty,
        lowStockThreshold: products.low_stock_threshold,
        merchantPrice: products.merchant_price_dzd,
        isActive: products.is_active,
        description: products.description,
        createdAt: products.created_at,
      })
      .from(products)
      .where(
        and(eq(products.merchant_id, profileId), isNull(products.deleted_at)),
      )
      .orderBy(desc(products.created_at))

    const productsList: Product[] = rows.map((r) => {
      const images =
        r.imageUrls && r.imageUrls.length > 0
          ? r.imageUrls
          : r.thumbnailUrl
            ? [r.thumbnailUrl]
            : []
      const status =
        r.stockQty === 0 ? 'out_of_stock' : !r.isActive ? 'paused' : 'active'
      return {
        id: r.id,
        name: r.name,
        category: toCategory(r.category),
        images,
        stockQuantity: r.stockQty,
        lowStockThreshold: r.lowStockThreshold,
        basePrice: r.merchantPrice,
        status,
        isActive: r.isActive,
        description: r.description ?? undefined,
        createdAt: r.createdAt.toISOString().slice(0, 10),
      }
    })

    const [statsRow] = await db
      .select({
        total: sql<number>`COUNT(*)`,
        active: sql<number>`COUNT(*) FILTER (WHERE ${products.is_active} = true AND ${products.stock_qty} > 0)`,
        outOfStock: sql<number>`COUNT(*) FILTER (WHERE ${products.stock_qty} = 0)`,
        inventoryValue: sql<number>`COALESCE(SUM(${products.merchant_price_dzd} * ${products.stock_qty}), 0)`,
      })
      .from(products)
      .where(
        and(eq(products.merchant_id, profileId), isNull(products.deleted_at)),
      )

    return {
      products: productsList,
      stats: {
        total: n(statsRow.total),
        active: n(statsRow.active),
        outOfStock: n(statsRow.outOfStock),
        inventoryValue: n(statsRow.inventoryValue),
      },
    }
  },
)

// ============================================================
// ADD PRODUCT
// ============================================================

const AddProductSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  category: z.string().min(1),
  stockQuantity: z.number().int().min(0),
  lowStockThreshold: z.number().int().min(1).default(10),
  basePrice: z.number().int().min(0),
  images: z.array(z.string()).max(5).default([]),
})

export const addProduct = createServerFn({ method: 'POST' })
  .inputValidator((input: unknown) => AddProductSchema.parse(input))
  .handler(async ({ data }) => {
    const { profileId } = await requireMerchant()

    const [created] = await db
      .insert(products)
      .values({
        merchant_id: profileId,
        name: data.name,
        description: data.description ?? null,
        category: data.category,
        thumbnail_url: data.images[0] ?? null,
        image_urls: data.images,
        merchant_price_dzd: data.basePrice,
        stock_qty: data.stockQuantity,
        low_stock_threshold: data.lowStockThreshold,
        is_active: data.stockQuantity > 0,
      })
      .returning({ id: products.id })

    return { success: true, id: created.id }
  })

// ============================================================
// UPDATE PRODUCT
// ============================================================

const UpdateProductSchema = AddProductSchema.extend({
  productId: z.string(),
})

export const updateProduct = createServerFn({ method: 'POST' })
  .inputValidator((input: unknown) => UpdateProductSchema.parse(input))
  .handler(async ({ data }) => {
    const { profileId } = await requireMerchant()

    const [existing] = await db
      .select({
        id: products.id,
        isActive: products.is_active,
        stockQty: products.stock_qty,
      })
      .from(products)
      .where(
        and(
          eq(products.id, data.productId),
          eq(products.merchant_id, profileId),
          isNull(products.deleted_at),
        ),
      )
      .limit(1)

    if (!existing) throw new Error('المنتج غير موجود')

    // sync is_active with stock changes:
    // - stock becomes 0 → deactivate (out of stock)
    // - stock was 0 (out_of_stock) and now restored → reactivate
    // - stock was > 0 and is_active was false (manually paused) → keep paused
    const wasOutOfStock = existing.stockQty === 0
    const newIsActive =
      data.stockQuantity === 0
        ? false
        : wasOutOfStock
          ? true
          : existing.isActive

    await db
      .update(products)
      .set({
        name: data.name,
        description: data.description ?? null,
        category: data.category,
        thumbnail_url: data.images[0] ?? null,
        image_urls: data.images,
        merchant_price_dzd: data.basePrice,
        stock_qty: data.stockQuantity,
        low_stock_threshold: data.lowStockThreshold,
        is_active: newIsActive,
      })
      .where(eq(products.id, data.productId))

    return { success: true }
  })

// ============================================================
// DELETE PRODUCT (soft)
// ============================================================

export const deleteProduct = createServerFn({ method: 'POST' })
  .inputValidator((input: unknown) =>
    z.object({ productId: z.string() }).parse(input),
  )
  .handler(async ({ data }) => {
    const { profileId } = await requireMerchant()

    const [existing] = await db
      .select({ id: products.id })
      .from(products)
      .where(
        and(
          eq(products.id, data.productId),
          eq(products.merchant_id, profileId),
          isNull(products.deleted_at),
        ),
      )
      .limit(1)

    if (!existing) throw new Error('المنتج غير موجود')

    await db
      .update(products)
      .set({ deleted_at: new Date() })
      .where(eq(products.id, data.productId))

    return { success: true }
  })

// ============================================================
// TOGGLE ACTIVE
// ============================================================

export const toggleProductActive = createServerFn({ method: 'POST' })
  .inputValidator((input: unknown) =>
    z.object({ productId: z.string() }).parse(input),
  )
  .handler(async ({ data }) => {
    const { profileId } = await requireMerchant()

    const [existing] = await db
      .select({ isActive: products.is_active, stockQty: products.stock_qty })
      .from(products)
      .where(
        and(
          eq(products.id, data.productId),
          eq(products.merchant_id, profileId),
          isNull(products.deleted_at),
        ),
      )
      .limit(1)

    if (!existing) throw new Error('المنتج غير موجود')

    const next = !existing.isActive
    if (next && existing.stockQty === 0)
      throw new Error('لا يمكن تفعيل منتج نفد مخزونه')

    await db
      .update(products)
      .set({ is_active: next })
      .where(eq(products.id, data.productId))

    return { success: true, isActive: next }
  })
