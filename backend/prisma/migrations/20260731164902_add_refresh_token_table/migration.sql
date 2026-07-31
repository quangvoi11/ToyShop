-- CreateTable
CREATE TABLE "RefreshTokens" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RefreshTokens_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "RefreshTokens_tokenHash_key" ON "RefreshTokens"("tokenHash");

-- CreateIndex
CREATE INDEX "RefreshTokens_userId_idx" ON "RefreshTokens"("userId");

-- AddForeignKey
ALTER TABLE "RefreshTokens" ADD CONSTRAINT "RefreshTokens_userId_fkey" FOREIGN KEY ("userId") REFERENCES "Users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Backfill các refresh token hash đang lưu trên User sang bảng mới
INSERT INTO "RefreshTokens" ("id", "userId", "tokenHash", "expiresAt", "createdAt")
SELECT gen_random_uuid(), "id", "refreshToken", NOW() + INTERVAL '30 days', NOW()
FROM "Users"
WHERE "refreshToken" IS NOT NULL;

-- Bỏ cột cũ
ALTER TABLE "Users" DROP COLUMN "refreshToken";
