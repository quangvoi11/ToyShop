-- Backfill emailVerifiedAt for users created before the email verification module.
UPDATE "Users" SET "emailVerifiedAt" = COALESCE("emailVerifiedAt", "createdAt") WHERE "emailVerifiedAt" IS NULL;
