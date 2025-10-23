-- AlterTable
ALTER TABLE "ProductProfile" ADD COLUMN "productUrl" TEXT;

-- CreateIndex
CREATE INDEX "ProductProfile_productUrl_idx" ON "ProductProfile"("productUrl");

