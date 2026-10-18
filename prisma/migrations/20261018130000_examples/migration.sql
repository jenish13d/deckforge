-- Public example pages (/examples/<slug>), published by admins from their own decks.
ALTER TABLE "Deck" ADD COLUMN "example" TEXT,
ADD COLUMN "exampleAt" TIMESTAMP(3);

CREATE UNIQUE INDEX "Deck_example_key" ON "Deck"("example");
