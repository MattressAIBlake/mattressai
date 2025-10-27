-- PostgreSQL Baseline Migration
-- Safe, idempotent migration that creates all tables if they don't exist
-- Compatible with Supabase and all PostgreSQL databases

-- Session table for Shopify authentication
CREATE TABLE IF NOT EXISTS "Session" (
    "id" TEXT NOT NULL,
    "shop" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "isOnline" BOOLEAN NOT NULL DEFAULT false,
    "scope" TEXT,
    "expires" TIMESTAMP(3),
    "accessToken" TEXT NOT NULL,
    "userId" BIGINT,
    "firstName" TEXT,
    "lastName" TEXT,
    "email" TEXT,
    "accountOwner" BOOLEAN NOT NULL DEFAULT false,
    "locale" TEXT,
    "collaborator" BOOLEAN DEFAULT false,
    "emailVerified" BOOLEAN DEFAULT false,
    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CustomerToken table
CREATE TABLE IF NOT EXISTS "CustomerToken" (
    "id" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "accessToken" TEXT NOT NULL,
    "refreshToken" TEXT,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "CustomerToken_pkey" PRIMARY KEY ("id")
);

-- CodeVerifier table
CREATE TABLE IF NOT EXISTS "CodeVerifier" (
    "id" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "verifier" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "CodeVerifier_pkey" PRIMARY KEY ("id")
);

-- Conversation table
CREATE TABLE IF NOT EXISTS "Conversation" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Conversation_pkey" PRIMARY KEY ("id")
);

-- Message table
CREATE TABLE IF NOT EXISTS "Message" (
    "id" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Message_pkey" PRIMARY KEY ("id")
);

-- CustomerAccountUrl table
CREATE TABLE IF NOT EXISTS "CustomerAccountUrl" (
    "id" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "CustomerAccountUrl_pkey" PRIMARY KEY ("id")
);

-- PromptVersion table
CREATE TABLE IF NOT EXISTS "PromptVersion" (
    "id" TEXT NOT NULL,
    "tenant" TEXT NOT NULL,
    "compiledPrompt" TEXT NOT NULL,
    "runtimeRules" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "PromptVersion_pkey" PRIMARY KEY ("id")
);

-- IndexJob table
CREATE TABLE IF NOT EXISTS "IndexJob" (
    "id" TEXT NOT NULL,
    "tenant" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finishedAt" TIMESTAMP(3),
    "totalProducts" INTEGER NOT NULL DEFAULT 0,
    "processedProducts" INTEGER NOT NULL DEFAULT 0,
    "failedProducts" INTEGER NOT NULL DEFAULT 0,
    "tokensUsed" INTEGER NOT NULL DEFAULT 0,
    "costEstimate" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "actualCost" DOUBLE PRECISION,
    "operationId" TEXT,
    "errorMessage" TEXT,
    "useAIEnrichment" BOOLEAN NOT NULL DEFAULT true,
    "confidenceThreshold" DOUBLE PRECISION NOT NULL DEFAULT 0.7,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "IndexJob_pkey" PRIMARY KEY ("id")
);

-- ProductProfile table
CREATE TABLE IF NOT EXISTS "ProductProfile" (
    "id" TEXT NOT NULL,
    "tenant" TEXT NOT NULL,
    "shopifyProductId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "imageUrl" TEXT,
    "productUrl" TEXT,
    "body" TEXT,
    "vendor" TEXT,
    "productType" TEXT,
    "tags" TEXT,
    "firmness" TEXT,
    "height" TEXT,
    "material" TEXT,
    "price" DOUBLE PRECISION,
    "certifications" TEXT,
    "features" TEXT,
    "supportFeatures" TEXT,
    "enrichedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "enrichmentMethod" TEXT NOT NULL,
    "confidence" DOUBLE PRECISION NOT NULL,
    "sourceEvidence" TEXT,
    "modelVersion" TEXT,
    "contentHash" TEXT NOT NULL,
    "lockedFirmness" BOOLEAN NOT NULL DEFAULT false,
    "lockedHeight" BOOLEAN NOT NULL DEFAULT false,
    "lockedMaterial" BOOLEAN NOT NULL DEFAULT false,
    "lockedCertifications" BOOLEAN NOT NULL DEFAULT false,
    "lockedFeatures" BOOLEAN NOT NULL DEFAULT false,
    "lockedSupportFeatures" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "ProductProfile_pkey" PRIMARY KEY ("id")
);

-- ChatSession table
CREATE TABLE IF NOT EXISTS "ChatSession" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "conversationId" TEXT,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endedAt" TIMESTAMP(3),
    "endReason" TEXT,
    "intentScore" INTEGER,
    "promptVersion" TEXT,
    "variantId" TEXT,
    "summary" TEXT,
    "consent" BOOLEAN,
    "lastActivityAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ChatSession_pkey" PRIMARY KEY ("id")
);

-- Lead table
CREATE TABLE IF NOT EXISTS "Lead" (
    "id" TEXT NOT NULL,
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
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Lead_pkey" PRIMARY KEY ("id")
);

-- Alert table
CREATE TABLE IF NOT EXISTS "Alert" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "sessionId" TEXT,
    "type" TEXT NOT NULL,
    "channel" TEXT NOT NULL,
    "payload" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'queued',
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "error" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sentAt" TIMESTAMP(3),
    CONSTRAINT "Alert_pkey" PRIMARY KEY ("id")
);

-- Event table
CREATE TABLE IF NOT EXISTS "Event" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "sessionId" TEXT,
    "type" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "metadata" TEXT NOT NULL,
    "clickId" TEXT,
    "variantId" TEXT,
    CONSTRAINT "Event_pkey" PRIMARY KEY ("id")
);

-- AlertSettings table
CREATE TABLE IF NOT EXISTS "AlertSettings" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "triggers" TEXT NOT NULL,
    "channels" TEXT NOT NULL,
    "quietHours" TEXT,
    "throttles" TEXT NOT NULL,
    "digest" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "AlertSettings_pkey" PRIMARY KEY ("id")
);

-- Experiment table
CREATE TABLE IF NOT EXISTS "Experiment" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "startAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Experiment_pkey" PRIMARY KEY ("id")
);

-- Variant table
CREATE TABLE IF NOT EXISTS "Variant" (
    "id" TEXT NOT NULL,
    "experimentId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "splitPercent" INTEGER NOT NULL,
    "promptVersionId" TEXT,
    "rulesOverrideJson" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Variant_pkey" PRIMARY KEY ("id")
);

-- Tenant table
CREATE TABLE IF NOT EXISTS "Tenant" (
    "id" TEXT NOT NULL,
    "shop" TEXT NOT NULL,
    "planName" TEXT NOT NULL DEFAULT 'starter',
    "billingId" TEXT,
    "billingStatus" TEXT,
    "trialEndsAt" TIMESTAMP(3),
    "quotas" TEXT,
    "fallbackMessageType" TEXT,
    "fallbackContactInfo" TEXT,
    "firstIndexCompleted" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Tenant_pkey" PRIMARY KEY ("id")
);

-- Plan table
CREATE TABLE IF NOT EXISTS "Plan" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    "features" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Plan_pkey" PRIMARY KEY ("id")
);

-- Add Foreign Key Constraints (only if tables exist)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'Message_conversationId_fkey'
    ) THEN
        ALTER TABLE "Message" ADD CONSTRAINT "Message_conversationId_fkey" 
        FOREIGN KEY ("conversationId") REFERENCES "Conversation"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'Lead_sessionId_fkey'
    ) THEN
        ALTER TABLE "Lead" ADD CONSTRAINT "Lead_sessionId_fkey" 
        FOREIGN KEY ("sessionId") REFERENCES "ChatSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'Alert_sessionId_fkey'
    ) THEN
        ALTER TABLE "Alert" ADD CONSTRAINT "Alert_sessionId_fkey" 
        FOREIGN KEY ("sessionId") REFERENCES "ChatSession"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'Event_sessionId_fkey'
    ) THEN
        ALTER TABLE "Event" ADD CONSTRAINT "Event_sessionId_fkey" 
        FOREIGN KEY ("sessionId") REFERENCES "ChatSession"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'Variant_experimentId_fkey'
    ) THEN
        ALTER TABLE "Variant" ADD CONSTRAINT "Variant_experimentId_fkey" 
        FOREIGN KEY ("experimentId") REFERENCES "Experiment"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

-- Create Unique Constraints (safe - only if they don't exist)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'CodeVerifier_state_key'
    ) THEN
        ALTER TABLE "CodeVerifier" ADD CONSTRAINT "CodeVerifier_state_key" UNIQUE ("state");
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'CustomerAccountUrl_conversationId_key'
    ) THEN
        ALTER TABLE "CustomerAccountUrl" ADD CONSTRAINT "CustomerAccountUrl_conversationId_key" UNIQUE ("conversationId");
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'ProductProfile_contentHash_key'
    ) THEN
        ALTER TABLE "ProductProfile" ADD CONSTRAINT "ProductProfile_contentHash_key" UNIQUE ("contentHash");
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'AlertSettings_tenantId_key'
    ) THEN
        ALTER TABLE "AlertSettings" ADD CONSTRAINT "AlertSettings_tenantId_key" UNIQUE ("tenantId");
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'Tenant_shop_key'
    ) THEN
        ALTER TABLE "Tenant" ADD CONSTRAINT "Tenant_shop_key" UNIQUE ("shop");
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'Plan_name_key'
    ) THEN
        ALTER TABLE "Plan" ADD CONSTRAINT "Plan_name_key" UNIQUE ("name");
    END IF;
END $$;

-- Create Indexes (if they don't already exist)
CREATE INDEX IF NOT EXISTS "CustomerToken_conversationId_idx" ON "CustomerToken"("conversationId");
CREATE INDEX IF NOT EXISTS "CodeVerifier_state_idx" ON "CodeVerifier"("state");
CREATE INDEX IF NOT EXISTS "Message_conversationId_idx" ON "Message"("conversationId");
CREATE INDEX IF NOT EXISTS "PromptVersion_tenant_idx" ON "PromptVersion"("tenant");
CREATE INDEX IF NOT EXISTS "PromptVersion_isActive_idx" ON "PromptVersion"("isActive");
CREATE INDEX IF NOT EXISTS "IndexJob_tenant_idx" ON "IndexJob"("tenant");
CREATE INDEX IF NOT EXISTS "IndexJob_status_idx" ON "IndexJob"("status");
CREATE INDEX IF NOT EXISTS "IndexJob_startedAt_idx" ON "IndexJob"("startedAt");
CREATE INDEX IF NOT EXISTS "ProductProfile_tenant_idx" ON "ProductProfile"("tenant");
CREATE INDEX IF NOT EXISTS "ProductProfile_shopifyProductId_idx" ON "ProductProfile"("shopifyProductId");
CREATE INDEX IF NOT EXISTS "ProductProfile_contentHash_idx" ON "ProductProfile"("contentHash");
CREATE INDEX IF NOT EXISTS "ProductProfile_productUrl_idx" ON "ProductProfile"("productUrl");
CREATE INDEX IF NOT EXISTS "ChatSession_tenantId_idx" ON "ChatSession"("tenantId");
CREATE INDEX IF NOT EXISTS "ChatSession_conversationId_idx" ON "ChatSession"("conversationId");
CREATE INDEX IF NOT EXISTS "ChatSession_endedAt_idx" ON "ChatSession"("endedAt");
CREATE INDEX IF NOT EXISTS "ChatSession_lastActivityAt_idx" ON "ChatSession"("lastActivityAt");
CREATE INDEX IF NOT EXISTS "ChatSession_variantId_idx" ON "ChatSession"("variantId");
CREATE INDEX IF NOT EXISTS "Lead_tenantId_idx" ON "Lead"("tenantId");
CREATE INDEX IF NOT EXISTS "Lead_sessionId_idx" ON "Lead"("sessionId");
CREATE INDEX IF NOT EXISTS "Lead_status_idx" ON "Lead"("status");
CREATE INDEX IF NOT EXISTS "Lead_createdAt_idx" ON "Lead"("createdAt");
CREATE INDEX IF NOT EXISTS "Lead_variantId_idx" ON "Lead"("variantId");
CREATE INDEX IF NOT EXISTS "Alert_tenantId_idx" ON "Alert"("tenantId");
CREATE INDEX IF NOT EXISTS "Alert_sessionId_idx" ON "Alert"("sessionId");
CREATE INDEX IF NOT EXISTS "Alert_status_idx" ON "Alert"("status");
CREATE INDEX IF NOT EXISTS "Alert_createdAt_idx" ON "Alert"("createdAt");
CREATE INDEX IF NOT EXISTS "Event_tenantId_idx" ON "Event"("tenantId");
CREATE INDEX IF NOT EXISTS "Event_sessionId_idx" ON "Event"("sessionId");
CREATE INDEX IF NOT EXISTS "Event_type_idx" ON "Event"("type");
CREATE INDEX IF NOT EXISTS "Event_timestamp_idx" ON "Event"("timestamp");
CREATE INDEX IF NOT EXISTS "Event_clickId_idx" ON "Event"("clickId");
CREATE INDEX IF NOT EXISTS "Event_variantId_idx" ON "Event"("variantId");
CREATE INDEX IF NOT EXISTS "AlertSettings_tenantId_idx" ON "AlertSettings"("tenantId");
CREATE INDEX IF NOT EXISTS "Experiment_tenantId_idx" ON "Experiment"("tenantId");
CREATE INDEX IF NOT EXISTS "Experiment_status_idx" ON "Experiment"("status");
CREATE INDEX IF NOT EXISTS "Experiment_startAt_idx" ON "Experiment"("startAt");
CREATE INDEX IF NOT EXISTS "Variant_experimentId_idx" ON "Variant"("experimentId");
CREATE INDEX IF NOT EXISTS "Tenant_shop_idx" ON "Tenant"("shop");
CREATE INDEX IF NOT EXISTS "Tenant_planName_idx" ON "Tenant"("planName");
CREATE INDEX IF NOT EXISTS "Tenant_billingStatus_idx" ON "Tenant"("billingStatus");
CREATE INDEX IF NOT EXISTS "Plan_name_idx" ON "Plan"("name");

