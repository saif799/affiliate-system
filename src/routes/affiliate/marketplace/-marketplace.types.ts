export type ProductCategory =
  | 'إلكترونيات'
  | 'ملابس'
  | 'تجميل'
  | 'رياضة'
  | 'أطفال'
  | 'منزل'
  | 'صحة'

export type ProductStatus = 'active' | 'limited' | 'hot'

export interface ProductVariant {
  id: string
  label: string
  stock: number
}

export interface ProductMedia {
  images: string[] // emoji placeholders
  driveUrl: string
  hasVideo: boolean
}

export interface Product {
  id: string
  name: string
  merchantName: string
  merchantId: string
  category: ProductCategory
  status: ProductStatus
  thumbnail: string
  msrpPrice: number      // سعر البيع للمستهلك
  basePrice: number      // سعر الجملة
  minSellingPrice: number
  commission: number     // msrpPrice - basePrice
  commissionRate: number // نسبة مئوية
  deliveredRate: number
  retourRate: number
  totalSales: number
  description: string
  copywriting: string
  variants: ProductVariant[]
  media: ProductMedia
  tags: string[]
}

export interface GeneratedLink {
  productId: string
  subId: string
  finalUrl: string
}

export interface MarketplaceFilters {
  search: string
  category: ProductCategory | 'الكل'
  sortBy: 'commission' | 'deliveredRate' | 'totalSales' | 'newest'
  hideHighRetour: boolean
}

export interface MarketplaceData {
  products: Product[]
  stats: {
    totalProducts: number
    avgCommission: number
    topCommission: number
  }
}