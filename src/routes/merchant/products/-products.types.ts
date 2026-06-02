// merchant/products/products.types.ts

export type ProductStatus = 'active' | 'paused' | 'out_of_stock'

export type ProductCategory = 'أحذية' | 'ملابس' | 'حقائب' | 'إلكترونيات' | 'أخرى'

export interface Product {
  id: string
  name: string
  category: ProductCategory
  images: string[] // روابط الصور (أقصى 5) — الأولى هي الصورة المعروضة
  stockQuantity: number
  lowStockThreshold: number // عتبة التحذير البرتقالي
  basePrice: number // سعر الجملة — ما يقبضه التاجر (merchant_price_dzd)
  status: ProductStatus
  isActive: boolean
  description?: string
  createdAt: string
}

export interface ProductsStats {
  total: number
  active: number
  outOfStock: number
  inventoryValue: number // إجمالي قيمة المخزون
}

export interface MerchantProductsData {
  products: Product[]
  stats: ProductsStats
}

// نموذج إضافة/تعديل منتج
export interface ProductFormData {
  name: string
  description: string
  category: ProductCategory
  stockQuantity: number
  lowStockThreshold: number
  basePrice: number
  images: string[] // روابط الصور بعد الرفع
}

export type ProductStatusFilter = 'all' | ProductStatus
