-- AlterTable
ALTER TABLE "ChatSession" ADD COLUMN "variantId" TEXT;

-- AlterTable
ALTER TABLE "Event" ADD COLUMN "variantId" TEXT;

-- AlterTable
ALTER TABLE "Lead" ADD COLUMN "variantId" TEXT;

-- CreateTable
CREATE TABLE "Experiment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenantId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "startAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Variant" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "experimentId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "splitPercent" INTEGER NOT NULL,
    "promptVersionId" TEXT,
    "rulesOverrideJson" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Variant_experimentId_fkey" FOREIGN KEY ("experimentId") REFERENCES "Experiment" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Tenant" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "shop" TEXT NOT NULL,
    "planName" TEXT NOT NULL DEFAULT 'starter',
    "billingId" TEXT,
    "trialEndsAt" DATETIME,
    "quotas" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Plan" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "price" REAL NOT NULL,
    "features" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE INDEX "Experiment_tenantId_idx" ON "Experiment"("tenantId");

-- CreateIndex
CREATE INDEX "Experiment_status_idx" ON "Experiment"("status");

-- CreateIndex
CREATE INDEX "Experiment_startAt_idx" ON "Experiment"("startAt");

-- CreateIndex
CREATE INDEX "Variant_experimentId_idx" ON "Variant"("experimentId");

-- CreateIndex
CREATE UNIQUE INDEX "Tenant_shop_key" ON "Tenant"("shop");

-- CreateIndex
CREATE INDEX "Tenant_shop_idx" ON "Tenant"("shop");

-- CreateIndex
CREATE INDEX "Tenant_planName_idx" ON "Tenant"("planName");

-- CreateIndex
CREATE UNIQUE INDEX "Plan_name_key" ON "Plan"("name");

-- CreateIndex
CREATE INDEX "Plan_name_idx" ON "Plan"("name");

-- CreateIndex
CREATE INDEX "ChatSession_variantId_idx" ON "ChatSession"("variantId");

-- CreateIndex
CREATE INDEX "Event_variantId_idx" ON "Event"("variantId");

-- CreateIndex
CREATE INDEX "Lead_variantId_idx" ON "Lead"("variantId");
