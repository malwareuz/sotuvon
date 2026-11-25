-- Multi-tenant foundation for existing SotuvOn databases.
-- Existing records are assigned to one legacy tenant; no business rows are deleted.
BEGIN;

CREATE TABLE "Tenant" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "ownerId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Tenant_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "TenantMember" (
  "id" TEXT NOT NULL,
  "tenantId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "role" "Role" NOT NULL DEFAULT 'CASHIER',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "TenantMember_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "Tenant_slug_key" ON "Tenant"("slug");
CREATE UNIQUE INDEX "TenantMember_userId_key" ON "TenantMember"("userId");
CREATE UNIQUE INDEX "TenantMember_tenantId_userId_key" ON "TenantMember"("tenantId", "userId");
CREATE INDEX "Tenant_ownerId_idx" ON "Tenant"("ownerId");
CREATE INDEX "TenantMember_tenantId_role_idx" ON "TenantMember"("tenantId", "role");

INSERT INTO "Tenant" ("id", "name", "slug", "ownerId", "createdAt", "updatedAt")
VALUES ('legacy_default_tenant', 'Default Store', 'default',
  (SELECT "id" FROM "User" ORDER BY "createdAt" ASC LIMIT 1), CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

ALTER TABLE "Product" ADD COLUMN "tenantId" TEXT;
ALTER TABLE "Customer" ADD COLUMN "tenantId" TEXT;
ALTER TABLE "Sale" ADD COLUMN "tenantId" TEXT;
ALTER TABLE "HeldOrder" ADD COLUMN "tenantId" TEXT;
ALTER TABLE "LoyaltyLog" ADD COLUMN "tenantId" TEXT;
ALTER TABLE "StockAdjustment" ADD COLUMN "tenantId" TEXT;
ALTER TABLE "Supplier" ADD COLUMN "tenantId" TEXT;
ALTER TABLE "Refund" ADD COLUMN "tenantId" TEXT;
ALTER TABLE "BusinessSettings" ADD COLUMN "tenantId" TEXT;
ALTER TABLE "Subscription" ADD COLUMN "tenantId" TEXT;
ALTER TABLE "Transaction" ADD COLUMN "tenantId" TEXT;

UPDATE "Product" SET "tenantId" = 'legacy_default_tenant' WHERE "tenantId" IS NULL;
UPDATE "Customer" SET "tenantId" = 'legacy_default_tenant' WHERE "tenantId" IS NULL;
UPDATE "Sale" SET "tenantId" = 'legacy_default_tenant' WHERE "tenantId" IS NULL;
UPDATE "HeldOrder" SET "tenantId" = 'legacy_default_tenant' WHERE "tenantId" IS NULL;
UPDATE "LoyaltyLog" SET "tenantId" = 'legacy_default_tenant' WHERE "tenantId" IS NULL;
UPDATE "StockAdjustment" SET "tenantId" = 'legacy_default_tenant' WHERE "tenantId" IS NULL;
UPDATE "Supplier" SET "tenantId" = 'legacy_default_tenant' WHERE "tenantId" IS NULL;
UPDATE "Refund" SET "tenantId" = 'legacy_default_tenant' WHERE "tenantId" IS NULL;
UPDATE "BusinessSettings" SET "tenantId" = 'legacy_default_tenant' WHERE "tenantId" IS NULL;
UPDATE "Subscription" SET "tenantId" = 'legacy_default_tenant' WHERE "tenantId" IS NULL;
UPDATE "Transaction" SET "tenantId" = 'legacy_default_tenant' WHERE "tenantId" IS NULL;

INSERT INTO "TenantMember" ("id", "tenantId", "userId", "role", "createdAt")
SELECT 'legacy_member_' || "id", 'legacy_default_tenant', "id", "role", CURRENT_TIMESTAMP FROM "User";

ALTER TABLE "Product" ALTER COLUMN "tenantId" SET NOT NULL;
CREATE INDEX "Product_tenantId_idx" ON "Product"("tenantId");
ALTER TABLE "Customer" ALTER COLUMN "tenantId" SET NOT NULL;
CREATE INDEX "Customer_tenantId_idx" ON "Customer"("tenantId");
ALTER TABLE "Sale" ALTER COLUMN "tenantId" SET NOT NULL;
CREATE INDEX "Sale_tenantId_idx" ON "Sale"("tenantId");
ALTER TABLE "HeldOrder" ALTER COLUMN "tenantId" SET NOT NULL;
CREATE INDEX "HeldOrder_tenantId_idx" ON "HeldOrder"("tenantId");
ALTER TABLE "LoyaltyLog" ALTER COLUMN "tenantId" SET NOT NULL;
CREATE INDEX "LoyaltyLog_tenantId_idx" ON "LoyaltyLog"("tenantId");
ALTER TABLE "StockAdjustment" ALTER COLUMN "tenantId" SET NOT NULL;
CREATE INDEX "StockAdjustment_tenantId_idx" ON "StockAdjustment"("tenantId");
ALTER TABLE "Supplier" ALTER COLUMN "tenantId" SET NOT NULL;
CREATE INDEX "Supplier_tenantId_idx" ON "Supplier"("tenantId");
ALTER TABLE "Refund" ALTER COLUMN "tenantId" SET NOT NULL;
CREATE INDEX "Refund_tenantId_idx" ON "Refund"("tenantId");
ALTER TABLE "BusinessSettings" ALTER COLUMN "tenantId" SET NOT NULL;
CREATE INDEX "BusinessSettings_tenantId_idx" ON "BusinessSettings"("tenantId");
ALTER TABLE "Subscription" ALTER COLUMN "tenantId" SET NOT NULL;
CREATE INDEX "Subscription_tenantId_idx" ON "Subscription"("tenantId");
ALTER TABLE "Transaction" ALTER COLUMN "tenantId" SET NOT NULL;
CREATE INDEX "Transaction_tenantId_idx" ON "Transaction"("tenantId");

DROP INDEX IF EXISTS "Product_sku_key";
DROP INDEX IF EXISTS "Product_barcode_key";
DROP INDEX IF EXISTS "Customer_phone_key";
DROP INDEX IF EXISTS "Customer_email_key";
CREATE UNIQUE INDEX "Product_tenantId_sku_key" ON "Product"("tenantId", "sku");
CREATE UNIQUE INDEX "Product_tenantId_barcode_key" ON "Product"("tenantId", "barcode");
CREATE UNIQUE INDEX "Customer_tenantId_phone_key" ON "Customer"("tenantId", "phone");
CREATE UNIQUE INDEX "Customer_tenantId_email_key" ON "Customer"("tenantId", "email");
CREATE UNIQUE INDEX "BusinessSettings_tenantId_key" ON "BusinessSettings"("tenantId");
CREATE UNIQUE INDEX "Subscription_tenantId_key" ON "Subscription"("tenantId");

ALTER TABLE "Tenant" ADD CONSTRAINT "Tenant_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "TenantMember" ADD CONSTRAINT "TenantMember_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "TenantMember" ADD CONSTRAINT "TenantMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Product" ADD CONSTRAINT "Product_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Customer" ADD CONSTRAINT "Customer_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Sale" ADD CONSTRAINT "Sale_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "HeldOrder" ADD CONSTRAINT "HeldOrder_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "LoyaltyLog" ADD CONSTRAINT "LoyaltyLog_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "StockAdjustment" ADD CONSTRAINT "StockAdjustment_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Supplier" ADD CONSTRAINT "Supplier_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Refund" ADD CONSTRAINT "Refund_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "BusinessSettings" ADD CONSTRAINT "BusinessSettings_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Subscription" ADD CONSTRAINT "Subscription_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

COMMIT;
