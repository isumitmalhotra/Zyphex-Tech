/*
  Warnings:

  - You are about to drop the column `ctaLink` on the `ContentSection` table. All the data in the column will be lost.
  - You are about to drop the column `ctaText` on the `ContentSection` table. All the data in the column will be lost.
  - You are about to drop the column `pageKey` on the `ContentSection` table. All the data in the column will be lost.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_ContentSection" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sectionKey" TEXT NOT NULL,
    "title" TEXT,
    "subtitle" TEXT,
    "content" TEXT,
    "imageUrl" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_ContentSection" ("content", "createdAt", "id", "imageUrl", "isActive", "order", "sectionKey", "subtitle", "title", "updatedAt") SELECT "content", "createdAt", "id", "imageUrl", "isActive", "order", "sectionKey", "subtitle", "title", "updatedAt" FROM "ContentSection";
DROP TABLE "ContentSection";
ALTER TABLE "new_ContentSection" RENAME TO "ContentSection";
CREATE UNIQUE INDEX "ContentSection_sectionKey_key" ON "ContentSection"("sectionKey");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
