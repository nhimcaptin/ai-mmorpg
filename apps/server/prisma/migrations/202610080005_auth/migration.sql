-- Expand only. Existing technical accounts are preserved, without invented credentials.
CREATE TABLE "Credential" (
  "accountId" UUID PRIMARY KEY REFERENCES "Account"("id"),
  "username" TEXT NOT NULL UNIQUE CHECK (length("username") BETWEEN 1 AND 256),
  "passwordHash" TEXT NOT NULL,
  "email" TEXT,
  "emailVerifiedAt" TIMESTAMP(3),
  CHECK ("emailVerifiedAt" IS NULL OR "email" IS NOT NULL)
);
CREATE TABLE "GameplaySession" (
  "accountId" UUID PRIMARY KEY REFERENCES "Account"("id"),
  "id" UUID NOT NULL UNIQUE,
  "tokenHash" TEXT NOT NULL UNIQUE,
  "expiresAt" TIMESTAMP(3) NOT NULL
);
