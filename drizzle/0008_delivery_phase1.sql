CREATE TYPE "public"."delivery_type" AS ENUM('home', 'office');--> statement-breakpoint
CREATE TABLE "delivery_offices" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"wilaya_id" integer NOT NULL,
	"office_code" text NOT NULL,
	"name" text NOT NULL,
	"address" text,
	"has_stop_desk" boolean DEFAULT false NOT NULL,
	"last_synced_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "delivery_pricing" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"wilaya_id" integer NOT NULL,
	"wilaya_name" text NOT NULL,
	"home_price_dzd" integer NOT NULL,
	"office_price_dzd" integer NOT NULL,
	"admin_override" boolean DEFAULT false NOT NULL,
	"last_synced_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "label_print_audit" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_id" uuid NOT NULL,
	"actor_user_id" text NOT NULL,
	"action" text NOT NULL,
	"result" text NOT NULL,
	"detail" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "delivery_type" "delivery_type" DEFAULT 'home' NOT NULL;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "delivery_office_id" uuid;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "internal_shipment_id" text;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "qr_token" text;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "label_printed_at" timestamp;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "label_token_used_at" timestamp;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "delivery_polled_at" timestamp;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "delivery_poll_failures" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "delivery_next_poll_at" timestamp;--> statement-breakpoint
ALTER TABLE "label_print_audit" ADD CONSTRAINT "label_print_audit_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "label_print_audit" ADD CONSTRAINT "label_print_audit_actor_user_id_users_id_fk" FOREIGN KEY ("actor_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "idx_delivery_offices_code" ON "delivery_offices" USING btree ("wilaya_id","office_code");--> statement-breakpoint
CREATE INDEX "idx_delivery_offices_wilaya" ON "delivery_offices" USING btree ("wilaya_id");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_delivery_pricing_wilaya" ON "delivery_pricing" USING btree ("wilaya_id");--> statement-breakpoint
CREATE INDEX "idx_label_audit_order" ON "label_print_audit" USING btree ("order_id");--> statement-breakpoint
CREATE INDEX "idx_label_audit_created" ON "label_print_audit" USING btree ("created_at");--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_delivery_office_id_delivery_offices_id_fk" FOREIGN KEY ("delivery_office_id") REFERENCES "public"."delivery_offices"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "idx_orders_internal_shipment" ON "orders" USING btree ("internal_shipment_id") WHERE "orders"."internal_shipment_id" IS NOT NULL;--> statement-breakpoint
CREATE INDEX "idx_orders_label_pending" ON "orders" USING btree ("status","label_printed_at");--> statement-breakpoint
CREATE INDEX "idx_orders_poll" ON "orders" USING btree ("status","delivery_next_poll_at");