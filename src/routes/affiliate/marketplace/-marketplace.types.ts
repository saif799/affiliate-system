// affiliate/marketplace/-marketplace.types.ts

export type ProductStatus = 'active' | 'limited'

export interface Product {
  id: string
  name: string
  merchantId: string
  merchantName: string
  category: string
  status: ProductStatus
  thumbnail: string // رابط الصورة الرئيسية (قد يكون فارغاً)
  images: string[] // روابط الصور
  videoUrl: string | null
  links: string[] // روابط إضافية (فيديوهات/صفحات) يضيفها التاجر
  basePrice: number // سعر الجملة (التكلفة على المسوّق) — يبيع بأي سعر أعلى
  stockQty: number
  deliveredRate: number
  retourRate: number
  totalSales: number // عدد الطلبيات المُسلّمة لهذا المنتج
  description: string
}

export interface MarketplaceFilters {
  search: string
  category: string // 'الكل' أو اسم فئة
  sortBy: 'newest' | 'deliveredRate' | 'totalSales' | 'priceLow'
  hideHighRetour: boolean
}

export interface GeneratedLink {
  productId: string
  slug: string
  subId: string | null
  finalUrl: string
}

export interface MarketplaceData {
  products: Product[]
  categories: string[]
  stats: {
    totalProducts: number
    avgBasePrice: number
    minBasePrice: number
  }
}
