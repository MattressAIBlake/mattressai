-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "shop" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "isOnline" BOOLEAN NOT NULL DEFAULT false,
    "scope" TEXT,
    "expires" DATETIME,
    "accessToken" TEXT NOT NULL,
    "userId" BIGINT,
    "firstName" TEXT,
    "lastName" TEXT,
    "email" TEXT,
    "accountOwner" BOOLEAN NOT NULL DEFAULT false,
    "locale" TEXT,
    "collaborator" BOOLEAN DEFAULT false,
    "emailVerified" BOOLEAN DEFAULT false
);

-- CreateTable
CREATE TABLE "CustomerToken" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "conversationId" TEXT NOT NULL,
    "accessToken" TEXT NOT NULL,
    "refreshToken" TEXT,
    "expiresAt" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "CodeVerifier" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "state" TEXT NOT NULL,
    "verifier" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Conversation" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Message" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "conversationId" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Message_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "Conversation" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "CustomerAccountUrl" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "conversationId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "PromptVersion" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenant" TEXT NOT NULL,
    "compiledPrompt" TEXT NOT NULL,
    "runtimeRules" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

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

-- CreateTable
CREATE TABLE "ChatSession" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenantId" TEXT NOT NULL,
    "conversationId" TEXT,
    "startedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endedAt" DATETIME,
    "endReason" TEXT,
    "intentScore" INTEGER,
    "promptVersion" TEXT,
    "variantId" TEXT,
    "summary" TEXT,
    "consent" BOOLEAN,
    "lastActivityAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "Lead" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenantId" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "name" TEXT,
    "zip" TEXT,
    "consent" BOOLEAN NOT NULL DEFAULT false,
    "shopifyCustomerId" TEXT,
    "variantId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'new',
    "tags" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Lead_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "ChatSession" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Alert" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenantId" TEXT NOT NULL,
    "sessionId" TEXT,
    "type" TEXT NOT NULL,
    "channel" TEXT NOT NULL,
    "payload" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'queued',
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "error" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sentAt" DATETIME,
    CONSTRAINT "Alert_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "ChatSession" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Event" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenantId" TEXT NOT NULL,
    "sessionId" TEXT,
    "type" TEXT NOT NULL,
    "timestamp" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "metadata" TEXT NOT NULL,
    "clickId" TEXT,
    "variantId" TEXT,
    CONSTRAINT "Event_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "ChatSession" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "AlertSettings" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenantId" TEXT NOT NULL,
    "triggers" TEXT NOT NULL,
    "channels" TEXT NOT NULL,
    "quietHours" TEXT,
    "throttles" TEXT NOT NULL,
    "digest" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

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
CREATE INDEX "CustomerToken_conversationId_idx" ON "CustomerToken"("conversationId");

-- CreateIndex
CREATE UNIQUE INDEX "CodeVerifier_state_key" ON "CodeVerifier"("state");

-- CreateIndex
CREATE INDEX "CodeVerifier_state_idx" ON "CodeVerifier"("state");

-- CreateIndex
CREATE INDEX "Message_conversationId_idx" ON "Message"("conversationId");

-- CreateIndex
CREATE UNIQUE INDEX "CustomerAccountUrl_conversationId_key" ON "CustomerAccountUrl"("conversationId");

-- CreateIndex
CREATE INDEX "PromptVersion_tenant_idx" ON "PromptVersion"("tenant");

-- CreateIndex
CREATE INDEX "PromptVersion_isActive_idx" ON "PromptVersion"("isActive");

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

-- CreateIndex
CREATE INDEX "ChatSession_tenantId_idx" ON "ChatSession"("tenantId");

-- CreateIndex
CREATE INDEX "ChatSession_conversationId_idx" ON "ChatSession"("conversationId");

-- CreateIndex
CREATE INDEX "ChatSession_endedAt_idx" ON "ChatSession"("endedAt");

-- CreateIndex
CREATE INDEX "ChatSession_lastActivityAt_idx" ON "ChatSession"("lastActivityAt");

-- CreateIndex
CREATE INDEX "ChatSession_variantId_idx" ON "ChatSession"("variantId");

-- CreateIndex
CREATE INDEX "Lead_tenantId_idx" ON "Lead"("tenantId");

-- CreateIndex
CREATE INDEX "Lead_sessionId_idx" ON "Lead"("sessionId");

-- CreateIndex
CREATE INDEX "Lead_status_idx" ON "Lead"("status");

-- CreateIndex
CREATE INDEX "Lead_createdAt_idx" ON "Lead"("createdAt");

-- CreateIndex
CREATE INDEX "Lead_variantId_idx" ON "Lead"("variantId");

-- CreateIndex
CREATE INDEX "Alert_tenantId_idx" ON "Alert"("tenantId");

-- CreateIndex
CREATE INDEX "Alert_sessionId_idx" ON "Alert"("sessionId");

-- CreateIndex
CREATE INDEX "Alert_status_idx" ON "Alert"("status");

-- CreateIndex
CREATE INDEX "Alert_createdAt_idx" ON "Alert"("createdAt");

-- CreateIndex
CREATE INDEX "Event_tenantId_idx" ON "Event"("tenantId");

-- CreateIndex
CREATE INDEX "Event_sessionId_idx" ON "Event"("sessionId");

-- CreateIndex
CREATE INDEX "Event_type_idx" ON "Event"("type");

-- CreateIndex
CREATE INDEX "Event_timestamp_idx" ON "Event"("timestamp");

-- CreateIndex
CREATE INDEX "Event_clickId_idx" ON "Event"("clickId");

-- CreateIndex
CREATE INDEX "Event_variantId_idx" ON "Event"("variantId");

-- CreateIndex
CREATE UNIQUE INDEX "AlertSettings_tenantId_key" ON "AlertSettings"("tenantId");

-- CreateIndex
CREATE INDEX "AlertSettings_tenantId_idx" ON "AlertSettings"("tenantId");

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
