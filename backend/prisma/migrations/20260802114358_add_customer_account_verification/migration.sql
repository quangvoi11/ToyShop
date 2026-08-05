-- AlterTable
ALTER TABLE "Address" ADD COLUMN     "recipientName" TEXT NOT NULL DEFAULT '';

-- AlterTable
ALTER TABLE "Orders" ADD COLUMN     "shippingCity" TEXT,
ADD COLUMN     "shippingDistrict" TEXT,
ADD COLUMN     "shippingPhone" TEXT,
ADD COLUMN     "shippingRecipientName" TEXT,
ADD COLUMN     "shippingStreet" TEXT,
ADD COLUMN     "shippingWard" TEXT;

-- AlterTable
ALTER TABLE "Users" ADD COLUMN     "emailVerifiedAt" TIMESTAMP(3),
ADD COLUMN     "verificationExpires" TIMESTAMP(3),
ADD COLUMN     "verificationToken" TEXT;
