-- CreateTable
CREATE TABLE "IndexJob" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenant" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "startedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finishedAt" DATETIME,
    "totalProducts" INTEGER NOT NULL DEFAULT 0,
    "processedProducts" INTEGER NOT NULL DEFAULT 0,
    "failedProducts" INTEGER NOT NULL DEFAULT 0,
    "tokensUsed" INTEGER NOT NULL DEFAULT 0,
    "costEstimate" REAL NOT NULL DEFAULT 0.0,
    "actualCost" REAL,
    "operationId" TEXT,
    "errorMessage" TEXT,
    "useAIEnrichment" BOOLEAN NOT NULL DEFAULT true,
    "confidenceThreshold" REAL NOT NULL DEFAULT 0.7,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "ProductProfile" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenant" TEXT NOT NULL,
    "shopifyProductId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT,
    "vendor" TEXT,
    "productType" TEXT,
    "tags" TEXT,
    "firmness" TEXT,
    "height" TEXT,
    "material" TEXT,
    "certifications" TEXT,
    "features" TEXT,
    "supportFeatures" TEXT,
    "enrichedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "enrichmentMethod" TEXT NOT NULL,
    "confidence" REAL NOT NULL,
    "sourceEvidence" TEXT,
    "modelVersion" TEXT,
    "contentHash" TEXT NOT NULL,
    "lockedFirmness" BOOLEAN NOT NULL DEFAULT false,
    "lockedHeight" BOOLEAN NOT NULL DEFAULT false,
    "lockedMaterial" BOOLEAN NOT NULL DEFAULT false,
    "lockedCertifications" BOOLEAN NOT NULL DEFAULT false,
    "lockedFeatures" BOOLEAN NOT NULL DEFAULT false,
    "lockedSupportFeatures" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE INDEX "IndexJob_tenant_idx" ON "IndexJob"("tenant");

-- CreateIndex
CREATE INDEX "IndexJob_status_idx" ON "IndexJob"("status");

-- CreateIndex
CREATE INDEX "IndexJob_startedAt_idx" ON "IndexJob"("startedAt");

-- CreateIndex
CREATE UNIQUE INDEX "ProductProfile_contentHash_key" ON "ProductProfile"("contentHash");

-- CreateIndex
CREATE INDEX "ProductProfile_tenant_idx" ON "ProductProfile"("tenant");

-- CreateIndex
CREATE INDEX "ProductProfile_shopifyProductId_idx" ON "ProductProfile"("shopifyProductId");

-- CreateIndex
CREATE INDEX "ProductProfile_contentHash_idx" ON "ProductProfile"("contentHash");
