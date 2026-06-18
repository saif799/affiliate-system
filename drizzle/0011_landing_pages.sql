-- آمنة لإعادة التشغيل: الأعمدة قد تكون مُطبَّقة مسبقاً عبر drizzle-kit push.
ALTER TABLE "tracking_links" ADD COLUMN IF NOT EXISTS "landing_enabled" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "tracking_links" ADD COLUMN IF NOT EXISTS "sale_price_dzd" integer;--> statement-breakpoint
ALTER TABLE "tracking_links" ADD COLUMN IF NOT EXISTS "landing_title" text;--> statement-breakpoint
ALTER TABLE "tracking_links" ADD COLUMN IF NOT EXISTS "landing_description" text;--> statement-breakpoint
ALTER TABLE "tracking_links" ADD COLUMN IF NOT EXISTS "landing_images" text[];--> statement-breakpoint
ALTER TABLE "tracking_links" ADD COLUMN IF NOT EXISTS "free_office_delivery" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "tracking_links" ADD COLUMN IF NOT EXISTS "free_home_delivery" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "tracking_links" ADD COLUMN IF NOT EXISTS "accent_color" text;
