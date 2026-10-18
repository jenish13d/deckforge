-- AlterTable
ALTER TABLE "User" ADD COLUMN     "expiresAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "Invite" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "note" TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),
    "userId" TEXT,
    "usedBy" TEXT,

    CONSTRAINT "Invite_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LaunchWaitlist" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "notifiedAt" TIMESTAMP(3),

    CONSTRAINT "LaunchWaitlist_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Invite_code_key" ON "Invite"("code");

-- CreateIndex
CREATE INDEX "Invite_createdAt_idx" ON "Invite"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "LaunchWaitlist_email_key" ON "LaunchWaitlist"("email");

-- CreateIndex
CREATE UNIQUE INDEX "LaunchWaitlist_token_key" ON "LaunchWaitlist"("token");

-- CreateIndex
CREATE INDEX "User_expiresAt_idx" ON "User"("expiresAt");
