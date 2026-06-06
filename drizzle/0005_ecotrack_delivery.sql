CREATE TABLE "delivery_accounts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"provider" text DEFAULT 'ecotrack' NOT NULL,
	"api_key" text NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"is_default" boolean DEFAULT false NOT NULL,
	"deleted_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "order_tracking_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_id" uuid NOT NULL,
	"status" text NOT NULL,
	"status_label" text NOT NULL,
	"description" text,
	"wilaya" text,
	"occurred_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "ecotrack_account_id" uuid;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "delivery_status" text DEFAULT 'pending';--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "returned_at" timestamp;--> statement-breakpoint
ALTER TABLE "order_tracking_events" ADD CONSTRAINT "order_tracking_events_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "idx_delivery_accounts_default" ON "delivery_accounts" USING btree ("provider") WHERE "delivery_accounts"."is_default" = true AND "delivery_accounts"."deleted_at" IS NULL;--> statement-breakpoint
CREATE INDEX "idx_tracking_events_order_id" ON "order_tracking_events" USING btree ("order_id");--> statement-breakpoint
CREATE INDEX "idx_tracking_events_occurred_at" ON "order_tracking_events" USING btree ("occurred_at");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_tracking_events_unique" ON "order_tracking_events" USING btree ("order_id","status","occurred_at");--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_ecotrack_account_id_delivery_accounts_id_fk" FOREIGN KEY ("ecotrack_account_id") REFERENCES "public"."delivery_accounts"("id") ON DELETE no action ON UPDATE no action;