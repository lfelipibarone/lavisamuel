-- CreateEnum
CREATE TYPE "Game" AS ENUM ('QUIZ', 'BOUQUET');

-- CreateTable
CREATE TABLE "Guest" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "nameKey" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Guest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GameResult" (
    "id" TEXT NOT NULL,
    "guestId" TEXT NOT NULL,
    "game" "Game" NOT NULL,
    "score" INTEGER NOT NULL,
    "maxScore" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GameResult_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Guest_nameKey_key" ON "Guest"("nameKey");

-- CreateIndex
CREATE INDEX "Guest_createdAt_idx" ON "Guest"("createdAt");

-- CreateIndex
CREATE INDEX "GameResult_game_score_idx" ON "GameResult"("game", "score" DESC);

-- CreateIndex
CREATE INDEX "GameResult_guestId_game_createdAt_idx" ON "GameResult"("guestId", "game", "createdAt");

-- AddForeignKey
ALTER TABLE "GameResult" ADD CONSTRAINT "GameResult_guestId_fkey" FOREIGN KEY ("guestId") REFERENCES "Guest"("id") ON DELETE CASCADE ON UPDATE CASCADE;
