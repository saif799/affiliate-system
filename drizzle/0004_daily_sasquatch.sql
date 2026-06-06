ALTER TABLE "orders" ADD COLUMN "external_source" text;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "external_order_id" text;--> statement-breakpoint
CREATE UNIQUE INDEX "idx_orders_external_unique" ON "orders" USING btree ("external_source","external_order_id") WHERE "orders"."external_order_id" IS NOT NULL;