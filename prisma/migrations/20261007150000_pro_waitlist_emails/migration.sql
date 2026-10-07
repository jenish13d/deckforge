-- CreateTable
CREATE TABLE "ProWaitlist" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "plan" TEXT NOT NULL DEFAULT 'pro',
    "token" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "notifiedAt" TIMESTAMP(3),

    CONSTRAINT "ProWaitlist_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ProWaitlist_email_key" ON "ProWaitlist"("email");

-- CreateIndex
CREATE UNIQUE INDEX "ProWaitlist_token_key" ON "ProWaitlist"("token");

-- People who joined before this table existed (User."proWaitlistAt") move onto the list.
INSERT INTO "ProWaitlist" ("id", "email", "plan", "token", "createdAt")
SELECT 'w' || replace(gen_random_uuid()::text, '-', ''), "email", 'pro', replace(gen_random_uuid()::text, '-', '') || replace(gen_random_uuid()::text, '-', ''), "proWaitlistAt"
FROM "User"
WHERE "proWaitlistAt" IS NOT NULL
ON CONFLICT ("email") DO NOTHING;
