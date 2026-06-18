-- توسيع نطاق منع تكرار الطلبيات الخارجية ليشمل المسوّق. آمنة لإعادة التشغيل.
DROP INDEX IF EXISTS "idx_orders_external_unique";--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "idx_orders_external_unique" ON "orders" USING btree ("affiliate_id","external_source","external_order_id") WHERE "orders"."external_order_id" IS NOT NULL;
