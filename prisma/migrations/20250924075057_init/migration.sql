-- CreateTable
CREATE TABLE "PasswordResetToken" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "ContentType" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "description" TEXT,
    "icon" TEXT,
    "fields" TEXT NOT NULL,
    "settings" TEXT NOT NULL,
    "isSystem" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "DynamicContentItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "contentTypeId" TEXT NOT NULL,
    "slug" TEXT,
    "title" TEXT NOT NULL,
    "data" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "publishedAt" DATETIME,
    "order" INTEGER NOT NULL DEFAULT 0,
    "categories" TEXT,
    "tags" TEXT,
    "author" TEXT,
    "metadata" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "DynamicContentItem_contentTypeId_fkey" FOREIGN KEY ("contentTypeId") REFERENCES "ContentType" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "DynamicContentSection" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "contentTypeId" TEXT NOT NULL,
    "sectionKey" TEXT NOT NULL,
    "title" TEXT,
    "subtitle" TEXT,
    "description" TEXT,
    "layoutSettings" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "DynamicContentSection_contentTypeId_fkey" FOREIGN KEY ("contentTypeId") REFERENCES "ContentType" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_PortfolioItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "slug" TEXT,
    "description" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "client" TEXT,
    "technologies" TEXT,
    "imageUrl" TEXT NOT NULL,
    "featuredImage" TEXT,
    "projectUrl" TEXT,
    "liveUrl" TEXT,
    "githubUrl" TEXT,
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "published" BOOLEAN NOT NULL DEFAULT true,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_PortfolioItem" ("category", "client", "createdAt", "description", "featured", "githubUrl", "id", "imageUrl", "isActive", "order", "projectUrl", "technologies", "title", "updatedAt") SELECT "category", "client", "createdAt", "description", "featured", "githubUrl", "id", "imageUrl", "isActive", "order", "projectUrl", "technologies", "title", "updatedAt" FROM "PortfolioItem";
DROP TABLE "PortfolioItem";
ALTER TABLE "new_PortfolioItem" RENAME TO "PortfolioItem";
CREATE UNIQUE INDEX "PortfolioItem_slug_key" ON "PortfolioItem"("slug");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "PasswordResetToken_token_key" ON "PasswordResetToken"("token");

-- CreateIndex
CREATE INDEX "PasswordResetToken_email_idx" ON "PasswordResetToken"("email");

-- CreateIndex
CREATE UNIQUE INDEX "ContentType_name_key" ON "ContentType"("name");

-- CreateIndex
CREATE INDEX "DynamicContentItem_contentTypeId_status_idx" ON "DynamicContentItem"("contentTypeId", "status");

-- CreateIndex
CREATE INDEX "DynamicContentItem_contentTypeId_featured_idx" ON "DynamicContentItem"("contentTypeId", "featured");

-- CreateIndex
CREATE INDEX "DynamicContentItem_status_publishedAt_idx" ON "DynamicContentItem"("status", "publishedAt");

-- CreateIndex
CREATE UNIQUE INDEX "DynamicContentItem_contentTypeId_slug_key" ON "DynamicContentItem"("contentTypeId", "slug");

-- CreateIndex
CREATE UNIQUE INDEX "DynamicContentSection_sectionKey_key" ON "DynamicContentSection"("sectionKey");

-- CreateIndex
CREATE INDEX "DynamicContentSection_contentTypeId_isActive_idx" ON "DynamicContentSection"("contentTypeId", "isActive");

-- CreateIndex
CREATE INDEX "DynamicContentSection_sectionKey_isActive_idx" ON "DynamicContentSection"("sectionKey", "isActive");
