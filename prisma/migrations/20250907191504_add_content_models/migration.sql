/*
  Warnings:

  - Added the required column `pageKey` to the `ContentSection` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_ContentSection" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "pageKey" TEXT NOT NULL,
    "sectionKey" TEXT NOT NULL,
    "title" TEXT,
    "subtitle" TEXT,
    "content" TEXT,
    "imageUrl" TEXT,
    "ctaText" TEXT,
    "ctaLink" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_ContentSection" ("content", "createdAt", "id", "imageUrl", "isActive", "order", "sectionKey", "subtitle", "title", "updatedAt") SELECT "content", "createdAt", "id", "imageUrl", "isActive", "order", "sectionKey", "subtitle", "title", "updatedAt" FROM "ContentSection";
DROP TABLE "ContentSection";
ALTER TABLE "new_ContentSection" RENAME TO "ContentSection";
CREATE UNIQUE INDEX "ContentSection_pageKey_sectionKey_key" ON "ContentSection"("pageKey", "sectionKey");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
