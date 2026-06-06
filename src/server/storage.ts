// ============================================================
// src/server/storage.ts
//
// طبقة تخزين الملفات — تعزل منطق الرفع عن مكان التخزين.
// التبديل إلى تخزين سحابي (S3 / Cloudflare R2) = تنفيذ فرع 'cloud'
// أدناه وضبط STORAGE_DRIVER، دون تعديل أي كود في دوال الرفع.
//
// متغيّرات البيئة:
//   STORAGE_DRIVER = 'local' (افتراضي) | 's3'
//   (للسحابي): S3_BUCKET, S3_REGION, S3_ACCESS_KEY, S3_SECRET, S3_PUBLIC_URL
// ============================================================

import { promises as fs } from 'node:fs'
import path from 'node:path'
import { randomUUID } from 'node:crypto'

const MAX_BYTES = 5 * 1024 * 1024 // 5MB

const MIME_TO_EXT: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
}

/**
 * يحفظ صورة واحدة ويُعيد رابطها العام.
 * يتحقّق من النوع والحجم قبل الحفظ.
 */
export async function saveImage(file: File): Promise<string> {
  if (!file.type.startsWith('image/')) throw new Error('الملف يجب أن يكون صورة')
  if (file.size > MAX_BYTES)
    throw new Error('حجم الصورة يجب أن يكون أقل من 5MB')

  const ext = MIME_TO_EXT[file.type] ?? 'jpg'
  const filename = `${randomUUID()}.${ext}`
  const buffer = Buffer.from(await file.arrayBuffer())

  const driver = process.env.STORAGE_DRIVER ?? 'local'

  if (driver === 'local') {
    const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'products')
    await fs.mkdir(uploadDir, { recursive: true })
    await fs.writeFile(path.join(uploadDir, filename), buffer)
    return `/uploads/products/${filename}`
  }

  // مكان تنفيذ S3/R2 لاحقاً (يتطلّب @aws-sdk/client-s3 + متغيّرات البيئة).
  // مثال:
  //   await s3.send(new PutObjectCommand({ Bucket, Key: filename, Body: buffer, ContentType: file.type }))
  //   return `${process.env.S3_PUBLIC_URL}/${filename}`
  throw new Error(`STORAGE_DRIVER غير مدعوم بعد: ${driver}`)
}
