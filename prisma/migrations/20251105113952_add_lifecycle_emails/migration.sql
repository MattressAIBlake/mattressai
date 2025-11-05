-- CreateTable
CREATE TABLE "LifecycleEmailTemplate" (
    "id" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "merchantSubject" TEXT NOT NULL,
    "merchantBody" TEXT NOT NULL,
    "teamSubject" TEXT,
    "teamBody" TEXT,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "sendToMerchant" BOOLEAN NOT NULL DEFAULT true,
    "sendToTeam" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LifecycleEmailTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LifecycleEmailLog" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "recipient" TEXT NOT NULL,
    "recipientType" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "error" TEXT,
    "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LifecycleEmailLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LifecycleEmailSettings" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT,
    "teamEmails" TEXT NOT NULL,
    "replyToEmail" TEXT,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LifecycleEmailSettings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "LifecycleEmailTemplate_eventType_key" ON "LifecycleEmailTemplate"("eventType");

-- CreateIndex
CREATE INDEX "LifecycleEmailTemplate_eventType_idx" ON "LifecycleEmailTemplate"("eventType");

-- CreateIndex
CREATE INDEX "LifecycleEmailTemplate_enabled_idx" ON "LifecycleEmailTemplate"("enabled");

-- CreateIndex
CREATE INDEX "LifecycleEmailLog_tenantId_idx" ON "LifecycleEmailLog"("tenantId");

-- CreateIndex
CREATE INDEX "LifecycleEmailLog_eventType_idx" ON "LifecycleEmailLog"("eventType");

-- CreateIndex
CREATE INDEX "LifecycleEmailLog_status_idx" ON "LifecycleEmailLog"("status");

-- CreateIndex
CREATE INDEX "LifecycleEmailLog_sentAt_idx" ON "LifecycleEmailLog"("sentAt");

-- CreateIndex
CREATE UNIQUE INDEX "LifecycleEmailSettings_tenantId_key" ON "LifecycleEmailSettings"("tenantId");

-- CreateIndex
CREATE INDEX "LifecycleEmailSettings_tenantId_idx" ON "LifecycleEmailSettings"("tenantId");

