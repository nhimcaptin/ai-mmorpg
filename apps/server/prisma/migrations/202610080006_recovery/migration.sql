CREATE TYPE "EmailChallengePurpose" AS ENUM ('VERIFY_EMAIL', 'RESET_PASSWORD');
CREATE TABLE "EmailChallenge" (
  "accountId" UUID NOT NULL REFERENCES "Account"("id"),
  "purpose" "EmailChallengePurpose" NOT NULL,
  "tokenHash" TEXT NOT NULL UNIQUE,
  "email" TEXT NOT NULL,
  "issuedAt" TIMESTAMP(3) NOT NULL,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  PRIMARY KEY ("accountId", "purpose"),
  CHECK ("expiresAt" > "issuedAt")
);
