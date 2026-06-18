-- آمنة لإعادة التشغيل (idempotent): جدولا order_comments/warning_replies قد يكونان
-- موجودَين مسبقاً (أُنشئا عبر drizzle-kit push في التطوير دون هجرة)، لذا نحرس كل عبارة.

CREATE TABLE IF NOT EXISTS "order_comments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_id" uuid NOT NULL,
	"author_user_id" text NOT NULL,
	"author_role" "user_role" NOT NULL,
	"body" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "warning_replies" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"warning_id" text NOT NULL,
	"target_user_id" text NOT NULL,
	"author_user_id" text NOT NULL,
	"author_role" "user_role" NOT NULL,
	"body" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "merchant_profiles" ADD COLUMN IF NOT EXISTS "ingest_api_key" text;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "links" text[];--> statement-breakpoint
DO $$ BEGIN
	ALTER TABLE "order_comments" ADD CONSTRAINT "order_comments_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null; END $$;--> statement-breakpoint
DO $$ BEGIN
	ALTER TABLE "order_comments" ADD CONSTRAINT "order_comments_author_user_id_users_id_fk" FOREIGN KEY ("author_user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null; END $$;--> statement-breakpoint
DO $$ BEGIN
	ALTER TABLE "warning_replies" ADD CONSTRAINT "warning_replies_target_user_id_users_id_fk" FOREIGN KEY ("target_user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null; END $$;--> statement-breakpoint
DO $$ BEGIN
	ALTER TABLE "warning_replies" ADD CONSTRAINT "warning_replies_author_user_id_users_id_fk" FOREIGN KEY ("author_user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null; END $$;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_order_comments_order" ON "order_comments" USING btree ("order_id","created_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_warning_replies_warning" ON "warning_replies" USING btree ("warning_id","created_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_warning_replies_target" ON "warning_replies" USING btree ("target_user_id");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "idx_merchant_ingest_key" ON "merchant_profiles" USING btree ("ingest_api_key") WHERE "merchant_profiles"."ingest_api_key" IS NOT NULL;
