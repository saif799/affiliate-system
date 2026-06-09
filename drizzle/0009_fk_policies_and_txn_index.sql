ALTER TABLE "label_print_audit" DROP CONSTRAINT "label_print_audit_actor_user_id_users_id_fk";
--> statement-breakpoint
ALTER TABLE "orders" DROP CONSTRAINT "orders_product_id_products_id_fk";
--> statement-breakpoint
ALTER TABLE "orders" DROP CONSTRAINT "orders_affiliate_id_affiliate_profiles_id_fk";
--> statement-breakpoint
ALTER TABLE "orders" DROP CONSTRAINT "orders_merchant_id_merchant_profiles_id_fk";
--> statement-breakpoint
ALTER TABLE "orders" DROP CONSTRAINT "orders_tracking_link_id_tracking_links_id_fk";
--> statement-breakpoint
ALTER TABLE "orders" DROP CONSTRAINT "orders_ecotrack_account_id_delivery_accounts_id_fk";
--> statement-breakpoint
ALTER TABLE "products" DROP CONSTRAINT "products_merchant_id_merchant_profiles_id_fk";
--> statement-breakpoint
ALTER TABLE "tracking_links" DROP CONSTRAINT "tracking_links_product_id_products_id_fk";
--> statement-breakpoint
ALTER TABLE "tracking_links" DROP CONSTRAINT "tracking_links_affiliate_id_affiliate_profiles_id_fk";
--> statement-breakpoint
ALTER TABLE "transactions" DROP CONSTRAINT "transactions_wallet_id_wallets_id_fk";
--> statement-breakpoint
ALTER TABLE "transactions" DROP CONSTRAINT "transactions_order_id_orders_id_fk";
--> statement-breakpoint
ALTER TABLE "transactions" DROP CONSTRAINT "transactions_related_txn_id_transactions_id_fk";
--> statement-breakpoint
ALTER TABLE "wallets" DROP CONSTRAINT "wallets_user_id_users_id_fk";
--> statement-breakpoint
ALTER TABLE "withdrawal_requests" DROP CONSTRAINT "withdrawal_requests_user_id_users_id_fk";
--> statement-breakpoint
ALTER TABLE "label_print_audit" ADD CONSTRAINT "label_print_audit_actor_user_id_users_id_fk" FOREIGN KEY ("actor_user_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_affiliate_id_affiliate_profiles_id_fk" FOREIGN KEY ("affiliate_id") REFERENCES "public"."affiliate_profiles"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_merchant_id_merchant_profiles_id_fk" FOREIGN KEY ("merchant_id") REFERENCES "public"."merchant_profiles"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_tracking_link_id_tracking_links_id_fk" FOREIGN KEY ("tracking_link_id") REFERENCES "public"."tracking_links"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_ecotrack_account_id_delivery_accounts_id_fk" FOREIGN KEY ("ecotrack_account_id") REFERENCES "public"."delivery_accounts"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "products" ADD CONSTRAINT "products_merchant_id_merchant_profiles_id_fk" FOREIGN KEY ("merchant_id") REFERENCES "public"."merchant_profiles"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tracking_links" ADD CONSTRAINT "tracking_links_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tracking_links" ADD CONSTRAINT "tracking_links_affiliate_id_affiliate_profiles_id_fk" FOREIGN KEY ("affiliate_id") REFERENCES "public"."affiliate_profiles"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_wallet_id_wallets_id_fk" FOREIGN KEY ("wallet_id") REFERENCES "public"."wallets"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_related_txn_id_transactions_id_fk" FOREIGN KEY ("related_txn_id") REFERENCES "public"."transactions"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wallets" ADD CONSTRAINT "wallets_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "withdrawal_requests" ADD CONSTRAINT "withdrawal_requests_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_transactions_status_created" ON "transactions" USING btree ("status","created_at");