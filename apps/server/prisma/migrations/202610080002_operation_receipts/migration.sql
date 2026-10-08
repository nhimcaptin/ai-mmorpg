ALTER TABLE "FoundationProbe" ADD COLUMN "value" INTEGER NOT NULL DEFAULT 0;
CREATE TABLE "OperationReceipt" (
  "scope" TEXT NOT NULL,
  "key" TEXT NOT NULL,
  "payloadHash" TEXT NOT NULL,
  "result" JSONB NOT NULL,
  CONSTRAINT "OperationReceipt_pkey" PRIMARY KEY ("scope", "key")
);
