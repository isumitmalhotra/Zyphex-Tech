-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_ContentType" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "description" TEXT,
    "icon" TEXT,
    "fields" TEXT NOT NULL,
    "settings" TEXT,
    "category" TEXT,
    "template" TEXT,
    "isSystem" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "allowMultiple" BOOLEAN NOT NULL DEFAULT true,
    "maxInstances" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_ContentType" ("createdAt", "description", "fields", "icon", "id", "isActive", "isSystem", "label", "name", "settings", "updatedAt") SELECT "createdAt", "description", "fields", "icon", "id", "isActive", "isSystem", "label", "name", "settings", "updatedAt" FROM "ContentType";
DROP TABLE "ContentType";
ALTER TABLE "new_ContentType" RENAME TO "ContentType";
CREATE UNIQUE INDEX "ContentType_name_key" ON "ContentType"("name");
CREATE INDEX "ContentType_category_isActive_idx" ON "ContentType"("category", "isActive");
CREATE INDEX "ContentType_isSystem_isActive_idx" ON "ContentType"("isSystem", "isActive");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
