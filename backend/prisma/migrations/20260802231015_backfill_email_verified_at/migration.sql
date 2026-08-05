-- Backfill emailVerifiedAt for users who registered before email verification was introduced.
-- Ensures legacy users are not locked out with EMAIL_NOT_VERIFIED after deploy.
UPDATE "Users" SET "emailVerifiedAt" = COALESCE("emailVerifiedAt", "createdAt") WHERE "emailVerifiedAt" IS NULL;
