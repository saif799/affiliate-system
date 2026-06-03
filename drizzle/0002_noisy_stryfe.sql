ALTER TABLE "orders" ADD COLUMN "platform_fee_merchant_dzd" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "platform_fee_affiliate_dzd" integer DEFAULT 0 NOT NULL;