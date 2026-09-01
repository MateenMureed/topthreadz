CREATE TABLE "HeroBanner" (
  "id" TEXT NOT NULL,
  "imageUrl" TEXT NOT NULL,
  "publicId" TEXT,
  "link" TEXT NOT NULL DEFAULT '/products',
  "position" INTEGER NOT NULL DEFAULT 0,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "altText" TEXT NOT NULL DEFAULT 'Top Threadz collection',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "HeroBanner_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "HeroBanner_isActive_position_idx" ON "HeroBanner"("isActive", "position");
