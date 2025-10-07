-- CreateTable
CREATE TABLE "PromptVersion" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenant" TEXT NOT NULL,
    "compiledPrompt" TEXT NOT NULL,
    "runtimeRules" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isActive" BOOLEAN NOT NULL DEFAULT false
);

-- CreateIndex
CREATE INDEX "PromptVersion_tenant_idx" ON "PromptVersion"("tenant");

-- CreateIndex
CREATE INDEX "PromptVersion_tenant_isActive_idx" ON "PromptVersion"("tenant", "isActive");
