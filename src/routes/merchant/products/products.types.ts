// merchant/products/products.types.ts

export type ProductStatus = 'active' | 'paused' | 'out_of_stock'

export type ProductCategory = 'أحذية' | 'ملابس' | 'حقائب' | 'إلكترونيات' | 'أخرى'

export interface Product {
  id: string
  name: string
  sku: string
  category: ProductCategory
  thumbnail: string           // emoji مؤقتاً، لاحقاً URL صورة حقيقية
  stockQuantity: number
  lowStockThreshold: number   // عتبة التحذير البرتقالي
  basePrice: number           // سعر الجملة — ما يقبضه التاجر
  msrpPrice: number           // سعر البيع المقترح للمسوق
  minSellingPrice: number     // الحد الأدنى لحماية من حرق الأسعار
  status: ProductStatus
  isActive: boolean
  mediaFolderUrl?: string     // رابط Google Drive للفيديوهات
  description?: string
  createdAt: string
}

export interface ProductsStats {
  total: number
  active: number
  outOfStock: number
  inventoryValue: number      // إجمالي قيمة المخزون
}

export interface MerchantProductsData {
  products: Product[]
  stats: ProductsStats
}

// نموذج إضافة/تعديل منتج
export interface ProductFormData {
  // الخطوة 1
  name: string
  description: string
  category: ProductCategory
  sku: string
  // الخطوة 2
  stockQuantity: number
  lowStockThreshold: number
  basePrice: number
  msrpPrice: number
  minSellingPrice: number
  // الخطوة 3
  thumbnail: string
  mediaFolderUrl: string
}

export type ProductStatusFilter = 'all' | ProductStatus