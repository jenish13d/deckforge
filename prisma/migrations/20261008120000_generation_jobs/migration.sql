-- CreateTable
CREATE TABLE "GenerationJob" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "deckId" TEXT NOT NULL,
    "cardId" TEXT NOT NULL,
    "mode" TEXT NOT NULL,
    "instruction" TEXT NOT NULL DEFAULT '',
    "region" TEXT,
    "status" TEXT NOT NULL DEFAULT 'queued',
    "stage" TEXT NOT NULL DEFAULT '',
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "maxAttempts" INTEGER NOT NULL DEFAULT 3,
    "cost" INTEGER NOT NULL,
    "provider" TEXT,
    "model" TEXT,
    "error" TEXT,
    "errorCode" TEXT,
    "idempotencyKey" TEXT NOT NULL,
    "runAfter" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lockedUntil" TIMESTAMP(3),
    "startedAt" TIMESTAMP(3),
    "finishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GenerationJob_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CreditLedger" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "jobId" TEXT,
    "amount" INTEGER NOT NULL,
    "type" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CreditLedger_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "GenerationJob_idempotencyKey_key" ON "GenerationJob"("idempotencyKey");

-- CreateIndex
CREATE INDEX "GenerationJob_userId_status_runAfter_idx" ON "GenerationJob"("userId", "status", "runAfter");

-- CreateIndex
CREATE INDEX "GenerationJob_deckId_cardId_createdAt_idx" ON "GenerationJob"("deckId", "cardId", "createdAt");

-- CreateIndex
CREATE INDEX "GenerationJob_status_runAfter_idx" ON "GenerationJob"("status", "runAfter");

-- CreateIndex
CREATE INDEX "CreditLedger_userId_createdAt_idx" ON "CreditLedger"("userId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "CreditLedger_jobId_type_key" ON "CreditLedger"("jobId", "type");

-- AddForeignKey
ALTER TABLE "GenerationJob" ADD CONSTRAINT "GenerationJob_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CreditLedger" ADD CONSTRAINT "CreditLedger_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CreditLedger" ADD CONSTRAINT "CreditLedger_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "GenerationJob"("id") ON DELETE SET NULL ON UPDATE CASCADE;


-- A card can have only one job that is waiting or running, so two tabs or a retried request
-- can never write (or charge for) the same card twice. Prisma can't express a partial index.
CREATE UNIQUE INDEX "GenerationJob_one_active_per_card" ON "GenerationJob"("cardId") WHERE "status" IN ('queued', 'running');

-- Guard rails on values the app relies on.
ALTER TABLE "GenerationJob" ADD CONSTRAINT "GenerationJob_status_check" CHECK ("status" IN ('queued', 'running', 'succeeded', 'failed', 'cancelled'));
ALTER TABLE "CreditLedger" ADD CONSTRAINT "CreditLedger_type_check" CHECK ("type" IN ('charge', 'refund'));
ALTER TABLE "CreditLedger" ADD CONSTRAINT "CreditLedger_amount_check" CHECK ("amount" > 0);
