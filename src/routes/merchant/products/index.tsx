// merchant/products/index.tsx

import { createFileRoute } from '@tanstack/react-router'
import { useState, useMemo } from 'react'
import { getMerchantProducts }      from './-server/products.api'
import { ProductStatsBar }          from './-components/ProductStatsBar'
import { ProductsTable }            from './-components/ProductsTable'
import { AddProductDrawer }         from './-components/AddProductDrawer'
import { AffiliatePreviewModal }    from './-components/AffiliatePreviewModal'
import type {
  Product,
  ProductStatusFilter,
  ProductFormData,
} from './products.types'

export const Route = createFileRoute('/merchant/products/')({
  loader: () => getMerchantProducts(),
  component: MerchantProductsPage,
})

function MerchantProductsPage() {
  const { products: initialProducts, stats } = Route.useLoaderData()

  const [products,       setProducts]       = useState<Product[]>(initialProducts)
  const [search,         setSearch]         = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [statusFilter,   setStatusFilter]   = useState<ProductStatusFilter>('all')
  const [drawerOpen,     setDrawerOpen]     = useState(false)
  const [editProduct,    setEditProduct]    = useState<Product | null>(null)
  const [previewProduct, setPreviewProduct] = useState<Product | null>(null)

  // قائمة الفئات الفريدة
  const categories = useMemo(
    () => ['all', ...new Set(products.map((p) => p.category))],
    [products],
  )

  // فلترة مجمّعة
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchSearch   = search === '' ||
        p.name.includes(search) ||
        p.sku.toLowerCase().includes(search.toLowerCase())
      const matchCategory = categoryFilter === 'all' || p.category === categoryFilter
      const matchStatus   = statusFilter   === 'all' || p.status   === statusFilter
      return matchSearch && matchCategory && matchStatus
    })
  }, [products, search, categoryFilter, statusFilter])

  // ─── Handlers ───

  const handleToggleActive = (id: string) => {
    setProducts((prev) =>
      prev.map((p) =>
        p.id === id
          ? {
              ...p,
              isActive: !p.isActive,
              status: !p.isActive ? 'active' : 'paused',
            }
          : p,
      ),
    )
  }

  const handleEdit = (product: Product) => {
    setEditProduct(product)
    setDrawerOpen(true)
  }

  const handleDelete = (id: string) => {
    if (confirm('هل أنت متأكد من حذف هذا المنتج؟')) {
      setProducts((prev) => prev.filter((p) => p.id !== id))
    }
  }

  const handleDrawerClose = () => {
    setDrawerOpen(false)
    setEditProduct(null)
  }

  const handleSubmit = (data: ProductFormData) => {
    if (editProduct) {
      // تعديل منتج موجود
      setProducts((prev) =>
        prev.map((p) =>
          p.id === editProduct.id
            ? {
                ...p,
                ...data,
                status: data.stockQuantity > 0
                  ? (p.isActive ? 'active' : 'paused')
                  : 'out_of_stock',
                isActive: data.stockQuantity > 0 ? p.isActive : false,
              }
            : p,
        ),
      )
      setEditProduct(null)
    } else {
      // إضافة منتج جديد
      const newProduct: Product = {
        id:        `PRD-${Date.now()}`,
        name:               data.name,
        sku:                data.sku,
        category:           data.category,
        thumbnail:          data.thumbnail,
        stockQuantity:      data.stockQuantity,
        lowStockThreshold:  data.lowStockThreshold,
        basePrice:          data.basePrice,
        msrpPrice:          data.msrpPrice,
        minSellingPrice:    data.minSellingPrice,
        status:             data.stockQuantity > 0 ? 'active' : 'out_of_stock',
        isActive:           data.stockQuantity > 0,
        mediaFolderUrl:     data.mediaFolderUrl,
        description:        data.description,
        createdAt:          new Date().toISOString().slice(0, 10),
      }
      setProducts((prev) => [newProduct, ...prev])
    }
  }

  return (
    <div className="p-6 space-y-5" dir="rtl">

      {/* ─── Header ─── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">إدارة المنتجات</h1>
          <p className="text-sm text-gray-500">تحكم كامل في مخزونك وتسعيرك</p>
        </div>
        <button
          onClick={() => {
            setEditProduct(null)
            setDrawerOpen(true)
          }}
          className="rounded-lg bg-gray-900 px-4 py-2 text-xs font-medium text-white transition-colors hover:bg-gray-700"
        >
          + إضافة منتج
        </button>
      </div>

      {/* ─── Stats ─── */}
      <ProductStatsBar stats={stats} />

      {/* ─── Filters ─── */}
      <div className="flex items-center gap-3">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="بحث بالاسم أو SKU..."
          className="w-64 rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs text-gray-800 placeholder:text-gray-400 outline-none focus:border-gray-400"
        />
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs text-gray-600 outline-none"
        >
          <option value="all">كل الفئات</option>
          {categories.filter((c) => c !== 'all').map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as ProductStatusFilter)}
          className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs text-gray-600 outline-none"
        >
          <option value="all">كل الحالات</option>
          <option value="active">نشط</option>
          <option value="paused">متوقف</option>
          <option value="out_of_stock">نفد المخزون</option>
        </select>
        <span className="text-xs text-gray-400">
          {filteredProducts.length} منتج
        </span>
      </div>

      {/* ─── Table ─── */}
      <ProductsTable
        products={filteredProducts}
        onToggleActive={handleToggleActive}
        onPreview={setPreviewProduct}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />

      {/* ─── Drawer إضافة/تعديل منتج ─── */}
      <AddProductDrawer
        isOpen={drawerOpen}
        onClose={handleDrawerClose}
        onSubmit={handleSubmit}
        editData={editProduct}
      />

      {/* ─── Modal معاينة كمسوق ─── */}
      <AffiliatePreviewModal
        product={previewProduct}
        onClose={() => setPreviewProduct(null)}
      />

    </div>
  )
}