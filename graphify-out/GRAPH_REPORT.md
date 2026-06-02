# Graph Report - src  (2026-06-01)

## Corpus Check
- 220 files · ~72,699 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1058 nodes · 1483 edges · 80 communities (56 shown, 24 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 1 edges (avg confidence: 0.8)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- [[_COMMUNITY_Analytics Dashboard|Analytics Dashboard]]
- [[_COMMUNITY_Admin Merchants UI|Admin Merchants UI]]
- [[_COMMUNITY_Admin Affiliates UI|Admin Affiliates UI]]
- [[_COMMUNITY_Landing Page Data|Landing Page Data]]
- [[_COMMUNITY_Commissions & Payouts|Commissions & Payouts]]
- [[_COMMUNITY_Generated Route Tree|Generated Route Tree]]
- [[_COMMUNITY_Form UI Components|Form UI Components]]
- [[_COMMUNITY_Registration Flow|Registration Flow]]
- [[_COMMUNITY_Admin Settings Tabs|Admin Settings Tabs]]
- [[_COMMUNITY_Affiliate Wallet UI|Affiliate Wallet UI]]
- [[_COMMUNITY_Settings PayoutSecurity|Settings Payout/Security]]
- [[_COMMUNITY_Admin Products Table|Admin Products Table]]
- [[_COMMUNITY_Settings Payout Methods|Settings Payout Methods]]
- [[_COMMUNITY_Affiliate Orders UI|Affiliate Orders UI]]
- [[_COMMUNITY_Admin Dashboard Data|Admin Dashboard Data]]
- [[_COMMUNITY_Merchant Settings Types|Merchant Settings Types]]
- [[_COMMUNITY_Affiliate Marketplace|Affiliate Marketplace]]
- [[_COMMUNITY_Settings API|Settings API]]
- [[_COMMUNITY_Merchant Products UI|Merchant Products UI]]
- [[_COMMUNITY_Affiliate Settings Types|Affiliate Settings Types]]
- [[_COMMUNITY_Affiliate Wallet Tables|Affiliate Wallet Tables]]
- [[_COMMUNITY_Merchant Dashboard UI|Merchant Dashboard UI]]
- [[_COMMUNITY_Merchant Orders UI|Merchant Orders UI]]
- [[_COMMUNITY_Merchants API & Invites|Merchants API & Invites]]
- [[_COMMUNITY_Layout & Auth Routes|Layout & Auth Routes]]
- [[_COMMUNITY_Integration Hub|Integration Hub]]
- [[_COMMUNITY_CampaignsProducts API|Campaigns/Products API]]
- [[_COMMUNITY_DB Schema & Enums|DB Schema & Enums]]
- [[_COMMUNITY_Auth & Invite Emails|Auth & Invite Emails]]
- [[_COMMUNITY_Admin Dashboard Charts|Admin Dashboard Charts]]
- [[_COMMUNITY_Session & Route Guards|Session & Route Guards]]
- [[_COMMUNITY_Affiliate Dashboard|Affiliate Dashboard]]
- [[_COMMUNITY_Admin Affiliate Types|Admin Affiliate Types]]
- [[_COMMUNITY_Admin Affiliates Page|Admin Affiliates Page]]
- [[_COMMUNITY_Affiliate Wallet Types|Affiliate Wallet Types]]
- [[_COMMUNITY_Marketplace Types|Marketplace Types]]
- [[_COMMUNITY_Merchant Wallet Types|Merchant Wallet Types]]
- [[_COMMUNITY_Merchant Dashboard Types|Merchant Dashboard Types]]
- [[_COMMUNITY_Merchant Product Types|Merchant Product Types]]
- [[_COMMUNITY_Merchant Orders Types|Merchant Orders Types]]
- [[_COMMUNITY_Settings Sidebar|Settings Sidebar]]
- [[_COMMUNITY_Login Page UI|Login Page UI]]
- [[_COMMUNITY_Auth Client & Pending|Auth Client & Pending]]
- [[_COMMUNITY_Router Setup|Router Setup]]
- [[_COMMUNITY_Header & Theme Toggle|Header & Theme Toggle]]
- [[_COMMUNITY_Notifications Toggles|Notifications Toggles]]
- [[_COMMUNITY_Affiliate Tier Drawer|Affiliate Tier Drawer]]
- [[_COMMUNITY_Affiliate Orders Types|Affiliate Orders Types]]
- [[_COMMUNITY_Affiliate Dashboard Types|Affiliate Dashboard Types]]
- [[_COMMUNITY_Affiliate Drawer|Affiliate Drawer]]
- [[_COMMUNITY_Affiliates Table|Affiliates Table]]
- [[_COMMUNITY_Orders Table|Orders Table]]
- [[_COMMUNITY_Profile Tab|Profile Tab]]
- [[_COMMUNITY_Stats Card|Stats Card]]
- [[_COMMUNITY_Demo Table Data|Demo Table Data]]
- [[_COMMUNITY_Integration Types|Integration Types]]
- [[_COMMUNITY_Settings Page|Settings Page]]
- [[_COMMUNITY_Recent Activity|Recent Activity]]
- [[_COMMUNITY_Recent Activity (alt)|Recent Activity (alt)]]
- [[_COMMUNITY_Orders Table (alt)|Orders Table (alt)]]
- [[_COMMUNITY_Notifications Tab|Notifications Tab]]
- [[_COMMUNITY_Profile Tab Avatar|Profile Tab Avatar]]
- [[_COMMUNITY_Overview Chart|Overview Chart]]
- [[_COMMUNITY_Affiliates API & Mock|Affiliates API & Mock]]
- [[_COMMUNITY_Products Table (alt)|Products Table (alt)]]
- [[_COMMUNITY_Wallet API & Mock|Wallet API & Mock]]
- [[_COMMUNITY_Dashboard Layout|Dashboard Layout]]
- [[_COMMUNITY_Merchant Layout|Merchant Layout]]
- [[_COMMUNITY_Register Types|Register Types]]
- [[_COMMUNITY_Overview Chart (alt)|Overview Chart (alt)]]
- [[_COMMUNITY_Stats Card (alt)|Stats Card (alt)]]
- [[_COMMUNITY_About Page|About Page]]
- [[_COMMUNITY_Dashboard Mock|Dashboard Mock]]
- [[_COMMUNITY_Settings Mock|Settings Mock]]
- [[_COMMUNITY_Dashboard Mock (alt)|Dashboard Mock (alt)]]
- [[_COMMUNITY_Settings Mock (alt)|Settings Mock (alt)]]
- [[_COMMUNITY_Settings Mock (alt2)|Settings Mock (alt2)]]
- [[_COMMUNITY_Commissions Mock|Commissions Mock]]
- [[_COMMUNITY_Auth Client Exports|Auth Client Exports]]

## God Nodes (most connected - your core abstractions)
1. `cn()` - 21 edges
2. `FileRoutesByPath` - 17 edges
3. `getSession` - 12 edges
4. `Merchant` - 11 edges
5. `db` - 9 edges
6. `auth` - 8 edges
7. `users` - 8 edges
8. `MerchantStatus` - 7 edges
9. `affiliateProfiles` - 6 edges
10. `orders` - 6 edges

## Surprising Connections (you probably didn't know these)
- `SelectTrigger()` --calls--> `cn()`  [EXTRACTED]
  components/ui/select.tsx → lib/utils.ts
- `SelectContent()` --calls--> `cn()`  [EXTRACTED]
  components/ui/select.tsx → lib/utils.ts
- `SelectLabel()` --calls--> `cn()`  [EXTRACTED]
  components/ui/select.tsx → lib/utils.ts
- `SelectItem()` --calls--> `cn()`  [EXTRACTED]
  components/ui/select.tsx → lib/utils.ts
- `SelectSeparator()` --calls--> `cn()`  [EXTRACTED]
  components/ui/select.tsx → lib/utils.ts

## Import Cycles
- None detected.

## Communities (80 total, 24 thin omitted)

### Community 0 - "Analytics Dashboard"
Cohesion: 0.05
Nodes (37): AnalyticsData, DateRange, DeliveryTiming, GmvPoint, PlatformKpis, TopAffiliate, TopMerchant, WilayaStat (+29 more)

### Community 1 - "Admin Merchants UI"
Cohesion: 0.07
Nodes (37): JoinRequestsSection(), Props, RequestModalProps, merchantColumns, MerchantDrawer(), Props, MerchantRowActions(), Props (+29 more)

### Community 2 - "Admin Affiliates UI"
Cohesion: 0.06
Nodes (32): AffiliatesData, AffiliateWarning, JoinRequest, StatValue, affiliateColumns, AffiliateWarnModal(), Props, FieldErrors (+24 more)

### Community 3 - "Landing Page Data"
Cohesion: 0.07
Nodes (26): affiliateFeatures, commissions, dashboardKpis, dashboardWilayas, footerCols, heroStats, merchantFeatures, navLinks (+18 more)

### Community 4 - "Commissions & Payouts"
Cohesion: 0.07
Nodes (23): CommissionsPageData, CommissionStats, ConfirmPaymentPayload, MonthlyPayoutPoint, PaymentBreakdown, PayoutMethod, TransactionRecord, WithdrawalRequest (+15 more)

### Community 5 - "Generated Route Tree"
Cohesion: 0.05
Nodes (42): AboutRoute, AffiliateDashboardIndexRoute, AffiliateMarketplaceIndexRoute, AffiliateOrdersIndexRoute, AffiliateRoute, AffiliateRouteChildren, AffiliateRouteWithChildren, AffiliateSettingsIndexRoute (+34 more)

### Community 6 - "Form UI Components"
Cohesion: 0.11
Nodes (21): Select(), SubscribeButton(), TextArea(), TextField(), { fieldContext, useFieldContext, formContext, useFormContext }, { useAppForm }, cn(), Button() (+13 more)

### Community 7 - "Registration Flow"
Cohesion: 0.09
Nodes (20): LoginForm(), LoginFormProps, PasswordField(), PasswordFieldProps, ProgressBar(), Step1Props, Step1RoleSelect(), Step2Props (+12 more)

### Community 8 - "Admin Settings Tabs"
Cohesion: 0.08
Nodes (26): FinancialTab(), Props, scheduleLabels, GeneralTab(), Props, InviteModalProps, Props, roleConfig (+18 more)

### Community 9 - "Affiliate Wallet UI"
Cohesion: 0.09
Nodes (19): BalanceCards(), formatDZD(), Props, METHOD_LABELS, Props, TRANSACTION_LABELS, TransactionsLedger(), WITHDRAWAL_STATUS_LABELS (+11 more)

### Community 10 - "Settings Payout/Security"
Cohesion: 0.09
Nodes (17): AddAccountModalProps, FREQUENCY_LABELS, PAYOUT_ICONS, PAYOUT_LABELS, DEVICE_ICONS, PasswordSection(), PasswordStrength(), Props (+9 more)

### Community 11 - "Admin Products Table"
Cohesion: 0.11
Nodes (14): FilterKey, FILTERS, Props, ProductStatsCard(), Props, Product, ProductsData, ProductStats (+6 more)

### Community 12 - "Settings Payout Methods"
Cohesion: 0.11
Nodes (12): METHOD_ICONS, METHOD_LABELS, Props, Props, getSettingsData, updateNotifications, updateProfile, addPayoutMethod (+4 more)

### Community 13 - "Affiliate Orders UI"
Cohesion: 0.11
Nodes (14): AddLeadModal(), EMPTY, PRODUCTS, Props, WILAYAS, OrdersFilters(), Props, TABS (+6 more)

### Community 14 - "Admin Dashboard Data"
Cohesion: 0.14
Nodes (13): ActivityItem, ActivityType, DashboardData, MonthlyRevenue, PlatformStats, StatMetric, TopAffiliate, WilayaStat (+5 more)

### Community 15 - "Merchant Settings Types"
Cohesion: 0.10
Nodes (19): ActiveSession, PayoutAccount, PayoutMethod, SettingsData, SettingsTab, LegalInfo, MerchantProfile, NotificationChannels (+11 more)

### Community 16 - "Affiliate Marketplace"
Cohesion: 0.13
Nodes (12): categories, MarketplaceFiltersBar(), Props, sortOptions, ProductCard(), Props, statusConfig, Props (+4 more)

### Community 17 - "Settings API"
Cohesion: 0.13
Nodes (15): getSettingsData, fetchFinancial(), fetchGeneral(), fetchKeys(), FINANCIAL_DEFAULTS, FINANCIAL_KEYS, GENERAL_DEFAULTS, GENERAL_KEYS (+7 more)

### Community 18 - "Merchant Products UI"
Cohesion: 0.13
Nodes (12): AddProductDrawer(), AddProductDrawerProps, CATEGORIES, EMPTY_FORM, steps, AffiliatePreviewModal(), AffiliatePreviewModalProps, ProductStatsBar() (+4 more)

### Community 19 - "Affiliate Settings Types"
Cohesion: 0.11
Nodes (18): ActiveSession, PayoutAccount, PayoutMethod, SecuritySettings, SettingsData, SettingsTab, AddPayoutMethodForm, AffiliateProfile (+10 more)

### Community 20 - "Affiliate Wallet Tables"
Cohesion: 0.13
Nodes (13): PayoutHistoryTable(), PayoutHistoryTableProps, statusConfig, PayoutModal(), PayoutModalProps, statusConfig, TransactionsTable(), TransactionsTableProps (+5 more)

### Community 21 - "Merchant Dashboard UI"
Cohesion: 0.13
Nodes (11): LowStockAlerts(), LowStockAlertsProps, RecentOrders(), RecentOrdersProps, statusConfig, TopProducts(), TopProductsProps, dateRangeOptions (+3 more)

### Community 22 - "Merchant Orders UI"
Cohesion: 0.13
Nodes (11): BulkActionBar(), BulkActionBarProps, OrdersPagination(), OrdersPaginationProps, OrdersTabs(), OrdersTabsProps, tabs, dateFilterOptions (+3 more)

### Community 23 - "Merchants API & Invites"
Cohesion: 0.15
Nodes (11): FieldErrors, INITIAL, InviteMerchantModal(), Props, settings, verifications, fetchMerchantStats(), getMonthRanges() (+3 more)

### Community 24 - "Layout & Auth Routes"
Cohesion: 0.13
Nodes (10): Route, Route, Route, navItems, Route, Route, Route, Route (+2 more)

### Community 25 - "Integration Hub"
Cohesion: 0.16
Nodes (10): ApiLogsPanel(), LEVEL_CONFIG, LogEntry, LogLevel, MOCK_LOGS, IntegrationCard(), Props, STATUS_CONFIG (+2 more)

### Community 26 - "Campaigns/Products API"
Cohesion: 0.23
Nodes (10): client, db, orders, products, ORDER_STATUS, buildOrdersAggCte(), fetchProducts(), fetchProductStats() (+2 more)

### Community 27 - "DB Schema & Enums"
Cohesion: 0.17
Nodes (11): accounts, acctStatusEnum, orderStatusEnum, orderStatusHistory, payoutMethodEnum, sessions, trackingLinks, transactionTypeEnum (+3 more)

### Community 28 - "Auth & Invite Emails"
Cohesion: 0.21
Nodes (11): affiliateProfiles, merchantProfiles, adminInviteHtml(), affiliateInviteHtml(), gmailTransporter, merchantInviteHtml(), pendingInviteTypes, resend (+3 more)

### Community 29 - "Admin Dashboard Charts"
Cohesion: 0.20
Nodes (8): TopAffiliates(), TopAffiliatesProps, COLORS, WilayaChart(), WilayaChartProps, statCards, Route, getDashboardData

### Community 30 - "Session & Route Guards"
Cohesion: 0.24
Nodes (7): getSession, MyRouterContext, requireSuperAdmin(), requireSuperAdmin(), auth, requireSuperAdmin(), requireSuperAdmin()

### Community 31 - "Affiliate Dashboard"
Cohesion: 0.22
Nodes (6): Props, StatsCards(), Props, TopMerchants(), Route, getAffiliateDashboard

### Community 32 - "Admin Affiliate Types"
Cohesion: 0.20
Nodes (9): AffiliateMonthlySale, AffiliatesPageData, AffiliateTier, AffiliateTopProduct, FilterStatus, SortKey, Affiliate, AffiliateStats (+1 more)

### Community 33 - "Admin Affiliates Page"
Cohesion: 0.27
Nodes (6): AffiliateKPIs(), formatDZD(), Props, AffiliatesFilters(), Props, Route

### Community 34 - "Affiliate Wallet Types"
Cohesion: 0.20
Nodes (9): Transaction, TransactionType, WalletData, PayoutMethod, PayoutMethodOption, PayoutRequest, PayoutStatus, TransactionStatus (+1 more)

### Community 35 - "Marketplace Types"
Cohesion: 0.22
Nodes (8): GeneratedLink, MarketplaceData, MarketplaceFilters, Product, ProductCategory, ProductMedia, ProductStatus, ProductVariant

### Community 36 - "Merchant Wallet Types"
Cohesion: 0.22
Nodes (8): Transaction, TransactionType, WalletData, PaymentMethod, WalletBalance, WithdrawalRequest, WithdrawalStatus, WithdrawFormData

### Community 37 - "Merchant Dashboard Types"
Cohesion: 0.25
Nodes (7): ChartDataPoint, DateRange, LowStockProduct, MerchantDashboardData, MerchantStats, TopProduct, RecentOrder

### Community 38 - "Merchant Product Types"
Cohesion: 0.25
Nodes (7): MerchantProductsData, Product, ProductCategory, ProductFormData, ProductsStats, ProductStatus, ProductStatusFilter

### Community 39 - "Merchant Orders Types"
Cohesion: 0.25
Nodes (7): BulkAction, DateFilter, MerchantOrdersData, Order, OrdersTabCount, TabFilter, OrderStatus

### Community 40 - "Settings Sidebar"
Cohesion: 0.25
Nodes (3): Props, tabs, Route

### Community 41 - "Login Page UI"
Cohesion: 0.32
Nodes (4): BrandLogo(), LoginCard(), LoginCardProps, Route

### Community 42 - "Auth Client & Pending"
Cohesion: 0.32
Nodes (3): authClient, Props, Route

### Community 43 - "Router Setup"
Cohesion: 0.32
Nodes (5): getRouter(), Register, Register, routeTree, getContext()

### Community 45 - "Notifications Toggles"
Cohesion: 0.29
Nodes (4): ToggleItem, ToggleProps, TOGGLES, Props

### Community 46 - "Affiliate Tier Drawer"
Cohesion: 0.40
Nodes (5): formatDZD(), TIER_LABELS, TIER_THRESHOLDS, AffiliateDrawer(), Props

### Community 47 - "Affiliate Orders Types"
Cohesion: 0.33
Nodes (5): AddLeadForm, AffiliateOrder, OrdersPageData, OrdersStats, OrderStatus

### Community 48 - "Affiliate Dashboard Types"
Cohesion: 0.33
Nodes (5): AffiliateDashboardData, DashboardStats, OrderStatus, TopMerchant, RecentOrder

### Community 49 - "Affiliate Drawer"
Cohesion: 0.53
Nodes (5): fmt(), statusColor(), statusLabel(), AffiliateDrawer(), Props

### Community 50 - "Affiliates Table"
Cohesion: 0.33
Nodes (3): Props, TIER_CLASSES, TIER_LABELS

### Community 51 - "Orders Table"
Cohesion: 0.40
Nodes (3): actionByStatus, OrdersTableProps, statusConfig

### Community 53 - "Stats Card"
Cohesion: 0.50
Nodes (4): Format, formatValue(), StatsCard(), StatsCardProps

### Community 55 - "Integration Types"
Cohesion: 0.40
Nodes (4): Integration, IntegrationCategory, IntegrationGroup, IntegrationStatus

### Community 56 - "Settings Page"
Cohesion: 0.40
Nodes (3): Route, NAV_ITEMS, TAB_TITLES

### Community 68 - "Register Types"
Cohesion: 0.50
Nodes (3): Role, State, Step

## Knowledge Gaps
- **382 isolated node(s):** `ThemeMode`, `Person`, `{ fieldContext, useFieldContext, formContext, useFormContext }`, `{ useAppForm }`, `SetPasswordRoute` (+377 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **24 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `PasswordStrength()` connect `Settings Payout/Security` to `Registration Flow`?**
  _High betweenness centrality (0.037) - this node is a cross-community bridge._
- **Why does `getSession` connect `Session & Route Guards` to `Analytics Dashboard`, `Admin Affiliates UI`, `Admin Dashboard Data`, `Settings API`, `Merchants API & Invites`, `Campaigns/Products API`?**
  _High betweenness centrality (0.030) - this node is a cross-community bridge._
- **What connects `ThemeMode`, `Person`, `{ fieldContext, useFieldContext, formContext, useFormContext }` to the rest of the system?**
  _382 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Analytics Dashboard` be split into smaller, more focused modules?**
  _Cohesion score 0.0546448087431694 - nodes in this community are weakly interconnected._
- **Should `Admin Merchants UI` be split into smaller, more focused modules?**
  _Cohesion score 0.07215686274509804 - nodes in this community are weakly interconnected._
- **Should `Admin Affiliates UI` be split into smaller, more focused modules?**
  _Cohesion score 0.06105457909343201 - nodes in this community are weakly interconnected._
- **Should `Landing Page Data` be split into smaller, more focused modules?**
  _Cohesion score 0.0730804810360777 - nodes in this community are weakly interconnected._