-- نقل مفتاح الاستيراد من التاجر إلى المسوّق (المتجر الخارجي يخصّ المسوّق).
-- آمنة لإعادة التشغيل.
DROP INDEX IF EXISTS "idx_merchant_ingest_key";--> statement-breakpoint
ALTER TABLE "affiliate_profiles" ADD COLUMN IF NOT EXISTS "ingest_api_key" text;--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "idx_affiliate_ingest_key" ON "affiliate_profiles" USING btree ("ingest_api_key") WHERE "affiliate_profiles"."ingest_api_key" IS NOT NULL;--> statement-breakpoint
ALTER TABLE "merchant_profiles" DROP COLUMN IF EXISTS "ingest_api_key";
