-- Comprehensive CMS System Migration
-- Phase 1.1: Database Schema Implementation
-- This migration adds enterprise-grade CMS capabilities to the platform

-- ============================================================================
-- CONTENT PAGES - Core page management with complete metadata
-- ============================================================================
CREATE TABLE IF NOT EXISTS "ContentPage" (
  "id" TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "pageKey" TEXT NOT NULL UNIQUE, -- Unique identifier (e.g., 'home', 'about', 'contact')
  "pageTitle" TEXT NOT NULL, -- Display title
  "slug" TEXT NOT NULL UNIQUE, -- URL slug
  "pageType" TEXT NOT NULL DEFAULT 'standard', -- standard, landing, blog, custom
  "templateId" TEXT, -- Reference to ContentTemplate
  
  -- Metadata
  "metaTitle" TEXT,
  "metaDescription" TEXT,
  "metaKeywords" TEXT,
  "ogImage" TEXT,
  "ogTitle" TEXT,
  "ogDescription" TEXT,
  "structuredData" JSONB, -- JSON-LD structured data for SEO
  
  -- Status & Publishing
  "status" TEXT NOT NULL DEFAULT 'draft', -- draft, review, scheduled, published, archived
  "publishedAt" TIMESTAMP,
  "scheduledPublishAt" TIMESTAMP,
  "scheduledUnpublishAt" TIMESTAMP,
  
  -- Authoring
  "authorId" TEXT, -- User who created/owns the page
  "lastEditedBy" TEXT, -- User who last edited
  
  -- Settings
  "isPublic" BOOLEAN NOT NULL DEFAULT true,
  "requiresAuth" BOOLEAN NOT NULL DEFAULT false,
  "allowComments" BOOLEAN NOT NULL DEFAULT false,
  "layout" TEXT DEFAULT 'default', -- Layout variant
  
  -- SEO Score
  "seoScore" INTEGER DEFAULT 0, -- 0-100 SEO quality score
  
  -- Timestamps
  "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "deletedAt" TIMESTAMP -- Soft delete
);

-- Indexes for ContentPage
CREATE INDEX "ContentPage_pageKey_idx" ON "ContentPage"("pageKey");
CREATE INDEX "ContentPage_slug_idx" ON "ContentPage"("slug");
CREATE INDEX "ContentPage_status_idx" ON "ContentPage"("status");
CREATE INDEX "ContentPage_templateId_idx" ON "ContentPage"("templateId");
CREATE INDEX "ContentPage_authorId_idx" ON "ContentPage"("authorId");
CREATE INDEX "ContentPage_publishedAt_idx" ON "ContentPage"("publishedAt");
CREATE INDEX "ContentPage_status_publishedAt_idx" ON "ContentPage"("status", "publishedAt");
CREATE INDEX "ContentPage_deletedAt_idx" ON "ContentPage"("deletedAt");

-- ============================================================================
-- CONTENT SECTIONS - Granular section-wise editing
-- ============================================================================
CREATE TABLE IF NOT EXISTS "ContentSection" (
  "id" TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "pageId" TEXT NOT NULL, -- Reference to ContentPage
  "sectionKey" TEXT NOT NULL, -- Unique key within page (e.g., 'hero', 'features-1')
  "sectionType" TEXT NOT NULL, -- hero, features, testimonials, cta, custom
  "title" TEXT,
  "subtitle" TEXT,
  
  -- Content stored as flexible JSONB
  "content" JSONB NOT NULL, -- Flexible JSON structure for any content type
  
  -- Layout & Display
  "order" INTEGER NOT NULL DEFAULT 0,
  "isVisible" BOOLEAN NOT NULL DEFAULT true,
  "cssClasses" TEXT, -- Custom CSS classes
  "customStyles" JSONB, -- Custom inline styles
  
  -- Responsive Settings
  "showOnMobile" BOOLEAN NOT NULL DEFAULT true,
  "showOnTablet" BOOLEAN NOT NULL DEFAULT true,
  "showOnDesktop" BOOLEAN NOT NULL DEFAULT true,
  
  -- Timestamps
  "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  
  -- Foreign Key
  CONSTRAINT "ContentSection_pageId_fkey" FOREIGN KEY ("pageId") 
    REFERENCES "ContentPage"("id") ON DELETE CASCADE
);

-- Indexes for ContentSection
CREATE INDEX "ContentSection_pageId_idx" ON "ContentSection"("pageId");
CREATE INDEX "ContentSection_sectionType_idx" ON "ContentSection"("sectionType");
CREATE INDEX "ContentSection_order_idx" ON "ContentSection"("order");
CREATE INDEX "ContentSection_pageId_order_idx" ON "ContentSection"("pageId", "order");
CREATE INDEX "ContentSection_isVisible_idx" ON "ContentSection"("isVisible");
CREATE UNIQUE INDEX "ContentSection_pageId_sectionKey_key" ON "ContentSection"("pageId", "sectionKey");

-- ============================================================================
-- CONTENT VERSIONS - Complete version control and rollback
-- ============================================================================
CREATE TABLE IF NOT EXISTS "ContentVersion" (
  "id" TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "pageId" TEXT NOT NULL, -- Reference to ContentPage
  "versionNumber" INTEGER NOT NULL,
  
  -- Complete snapshot of page state
  "pageSnapshot" JSONB NOT NULL, -- Full page data at this version
  "sectionsSnapshot" JSONB NOT NULL, -- All sections data at this version
  
  -- Metadata
  "changeDescription" TEXT, -- Description of what changed
  "createdBy" TEXT NOT NULL, -- User who created this version
  "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  
  -- Version tags
  "isPublished" BOOLEAN NOT NULL DEFAULT false, -- Was this version published?
  "publishedAt" TIMESTAMP,
  "tags" TEXT[], -- Array of tags (e.g., ['major-update', 'content-refresh'])
  
  -- Foreign Key
  CONSTRAINT "ContentVersion_pageId_fkey" FOREIGN KEY ("pageId") 
    REFERENCES "ContentPage"("id") ON DELETE CASCADE
);

-- Indexes for ContentVersion
CREATE INDEX "ContentVersion_pageId_idx" ON "ContentVersion"("pageId");
CREATE INDEX "ContentVersion_createdBy_idx" ON "ContentVersion"("createdBy");
CREATE INDEX "ContentVersion_createdAt_idx" ON "ContentVersion"("createdAt");
CREATE INDEX "ContentVersion_pageId_versionNumber_idx" ON "ContentVersion"("pageId", "versionNumber");
CREATE INDEX "ContentVersion_isPublished_idx" ON "ContentVersion"("isPublished");
CREATE UNIQUE INDEX "ContentVersion_pageId_versionNumber_key" ON "ContentVersion"("pageId", "versionNumber");

-- ============================================================================
-- CONTENT TEMPLATES - Reusable page templates
-- ============================================================================
CREATE TABLE IF NOT EXISTS "ContentTemplate" (
  "id" TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "category" TEXT NOT NULL DEFAULT 'general', -- landing, blog, portfolio, custom, etc.
  
  -- Template structure
  "templateStructure" JSONB NOT NULL, -- Defines available sections and layout
  "defaultContent" JSONB, -- Default content for new pages
  "thumbnailUrl" TEXT, -- Preview image
  
  -- Settings
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "isSystem" BOOLEAN NOT NULL DEFAULT false, -- System templates can't be deleted
  "order" INTEGER NOT NULL DEFAULT 0,
  
  -- Timestamps
  "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for ContentTemplate
CREATE INDEX "ContentTemplate_category_idx" ON "ContentTemplate"("category");
CREATE INDEX "ContentTemplate_isActive_idx" ON "ContentTemplate"("isActive");
CREATE INDEX "ContentTemplate_order_idx" ON "ContentTemplate"("order");
CREATE INDEX "ContentTemplate_category_isActive_idx" ON "ContentTemplate"("category", "isActive");

-- ============================================================================
-- MEDIA LIBRARY - Professional digital asset management
-- ============================================================================
CREATE TABLE IF NOT EXISTS "MediaAsset" (
  "id" TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "folderId" TEXT, -- Reference to MediaFolder
  "filename" TEXT NOT NULL,
  "originalName" TEXT NOT NULL,
  "filePath" TEXT NOT NULL, -- Relative path on VPS
  "fileUrl" TEXT NOT NULL, -- Public URL
  "mimeType" TEXT NOT NULL,
  "fileSize" BIGINT NOT NULL, -- Size in bytes
  
  -- Asset type
  "assetType" TEXT NOT NULL, -- image, video, document, audio, other
  
  -- Image-specific metadata
  "width" INTEGER,
  "height" INTEGER,
  "aspectRatio" TEXT,
  "dominantColor" TEXT,
  
  -- SEO & Accessibility
  "altText" TEXT,
  "caption" TEXT,
  "description" TEXT,
  
  -- Organization
  "tags" TEXT[], -- Array of tags for search/filter
  "categories" TEXT[], -- Array of categories
  
  -- Processing status
  "processingStatus" TEXT DEFAULT 'completed', -- pending, processing, completed, failed
  "thumbnailUrl" TEXT,
  "optimizedUrl" TEXT,
  
  -- Usage tracking
  "usageCount" INTEGER NOT NULL DEFAULT 0,
  "lastUsedAt" TIMESTAMP,
  
  -- Upload info
  "uploadedBy" TEXT NOT NULL,
  "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "deletedAt" TIMESTAMP -- Soft delete
);

-- Indexes for MediaAsset
CREATE INDEX "MediaAsset_folderId_idx" ON "MediaAsset"("folderId");
CREATE INDEX "MediaAsset_assetType_idx" ON "MediaAsset"("assetType");
CREATE INDEX "MediaAsset_uploadedBy_idx" ON "MediaAsset"("uploadedBy");
CREATE INDEX "MediaAsset_createdAt_idx" ON "MediaAsset"("createdAt");
CREATE INDEX "MediaAsset_tags_idx" ON "MediaAsset" USING GIN ("tags");
CREATE INDEX "MediaAsset_deletedAt_idx" ON "MediaAsset"("deletedAt");
CREATE INDEX "MediaAsset_folderId_assetType_idx" ON "MediaAsset"("folderId", "assetType");

-- ============================================================================
-- MEDIA FOLDERS - Hierarchical organization
-- ============================================================================
CREATE TABLE IF NOT EXISTS "MediaFolder" (
  "id" TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "name" TEXT NOT NULL,
  "parentId" TEXT, -- Self-reference for nested folders
  "path" TEXT NOT NULL, -- Full path for easy navigation (e.g., '/images/portfolio')
  "description" TEXT,
  "color" TEXT, -- Folder color for UI organization
  "icon" TEXT, -- Icon identifier
  
  -- Metadata
  "createdBy" TEXT NOT NULL,
  "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for MediaFolder
CREATE INDEX "MediaFolder_parentId_idx" ON "MediaFolder"("parentId");
CREATE INDEX "MediaFolder_path_idx" ON "MediaFolder"("path");
CREATE INDEX "MediaFolder_createdBy_idx" ON "MediaFolder"("createdBy");
CREATE UNIQUE INDEX "MediaFolder_parentId_name_key" ON "MediaFolder"("parentId", "name");

-- ============================================================================
-- CONTENT WORKFLOWS - Multi-step approval process
-- ============================================================================
CREATE TABLE IF NOT EXISTS "ContentWorkflow" (
  "id" TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "pageId" TEXT NOT NULL, -- Reference to ContentPage
  "versionId" TEXT, -- Reference to specific version if applicable
  
  -- Workflow status
  "status" TEXT NOT NULL DEFAULT 'pending', -- pending, in_review, approved, rejected, changes_requested
  "currentStep" INTEGER NOT NULL DEFAULT 1,
  "totalSteps" INTEGER NOT NULL DEFAULT 1,
  
  -- Participants
  "submittedBy" TEXT NOT NULL,
  "submittedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "reviewers" TEXT[], -- Array of user IDs who can review
  "currentReviewer" TEXT, -- Current assigned reviewer
  
  -- Review details
  "reviewerNotes" TEXT,
  "reviewedBy" TEXT,
  "reviewedAt" TIMESTAMP,
  
  -- Completion
  "completedAt" TIMESTAMP,
  
  -- Workflow history (JSON array of status changes)
  "history" JSONB DEFAULT '[]'::jsonb,
  
  -- Foreign Key
  CONSTRAINT "ContentWorkflow_pageId_fkey" FOREIGN KEY ("pageId") 
    REFERENCES "ContentPage"("id") ON DELETE CASCADE
);

-- Indexes for ContentWorkflow
CREATE INDEX "ContentWorkflow_pageId_idx" ON "ContentWorkflow"("pageId");
CREATE INDEX "ContentWorkflow_status_idx" ON "ContentWorkflow"("status");
CREATE INDEX "ContentWorkflow_submittedBy_idx" ON "ContentWorkflow"("submittedBy");
CREATE INDEX "ContentWorkflow_currentReviewer_idx" ON "ContentWorkflow"("currentReviewer");
CREATE INDEX "ContentWorkflow_submittedAt_idx" ON "ContentWorkflow"("submittedAt");
CREATE INDEX "ContentWorkflow_reviewers_idx" ON "ContentWorkflow" USING GIN ("reviewers");

-- ============================================================================
-- CONTENT SCHEDULE - Automated publishing/unpublishing
-- ============================================================================
CREATE TABLE IF NOT EXISTS "ContentSchedule" (
  "id" TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "pageId" TEXT NOT NULL, -- Reference to ContentPage
  
  -- Schedule type
  "scheduleType" TEXT NOT NULL, -- publish, unpublish, update
  "scheduledFor" TIMESTAMP NOT NULL,
  "timezone" TEXT NOT NULL DEFAULT 'UTC',
  
  -- Execution status
  "status" TEXT NOT NULL DEFAULT 'pending', -- pending, executed, failed, cancelled
  "executedAt" TIMESTAMP,
  "failureReason" TEXT,
  
  -- Content to apply (for update schedules)
  "contentSnapshot" JSONB,
  
  -- Metadata
  "createdBy" TEXT NOT NULL,
  "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  
  -- Foreign Key
  CONSTRAINT "ContentSchedule_pageId_fkey" FOREIGN KEY ("pageId") 
    REFERENCES "ContentPage"("id") ON DELETE CASCADE
);

-- Indexes for ContentSchedule
CREATE INDEX "ContentSchedule_pageId_idx" ON "ContentSchedule"("pageId");
CREATE INDEX "ContentSchedule_scheduledFor_idx" ON "ContentSchedule"("scheduledFor");
CREATE INDEX "ContentSchedule_status_idx" ON "ContentSchedule"("status");
CREATE INDEX "ContentSchedule_status_scheduledFor_idx" ON "ContentSchedule"("status", "scheduledFor");
CREATE INDEX "ContentSchedule_createdBy_idx" ON "ContentSchedule"("createdBy");

-- ============================================================================
-- CMS ACTIVITY LOG - Audit trail for all CMS actions
-- ============================================================================
CREATE TABLE IF NOT EXISTS "CmsActivityLog" (
  "id" TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "userId" TEXT NOT NULL,
  "action" TEXT NOT NULL, -- create_page, edit_section, publish, rollback, etc.
  "entityType" TEXT NOT NULL, -- page, section, template, media, workflow
  "entityId" TEXT NOT NULL,
  "changes" JSONB, -- Detailed change data
  "metadata" JSONB, -- Additional context
  "ipAddress" TEXT,
  "userAgent" TEXT,
  "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for CmsActivityLog
CREATE INDEX "CmsActivityLog_userId_idx" ON "CmsActivityLog"("userId");
CREATE INDEX "CmsActivityLog_action_idx" ON "CmsActivityLog"("action");
CREATE INDEX "CmsActivityLog_entityType_idx" ON "CmsActivityLog"("entityType");
CREATE INDEX "CmsActivityLog_entityId_idx" ON "CmsActivityLog"("entityId");
CREATE INDEX "CmsActivityLog_createdAt_idx" ON "CmsActivityLog"("createdAt");
CREATE INDEX "CmsActivityLog_userId_createdAt_idx" ON "CmsActivityLog"("userId", "createdAt");
CREATE INDEX "CmsActivityLog_entityType_entityId_idx" ON "CmsActivityLog"("entityType", "entityId");

-- ============================================================================
-- Add Foreign Key for ContentPage template reference
-- ============================================================================
ALTER TABLE "ContentPage" 
  ADD CONSTRAINT "ContentPage_templateId_fkey" 
  FOREIGN KEY ("templateId") REFERENCES "ContentTemplate"("id") ON DELETE SET NULL;

-- ============================================================================
-- Add Foreign Key for MediaAsset folder reference
-- ============================================================================
ALTER TABLE "MediaAsset" 
  ADD CONSTRAINT "MediaAsset_folderId_fkey" 
  FOREIGN KEY ("folderId") REFERENCES "MediaFolder"("id") ON DELETE SET NULL;

-- ============================================================================
-- Add Self-referencing Foreign Key for MediaFolder hierarchy
-- ============================================================================
ALTER TABLE "MediaFolder" 
  ADD CONSTRAINT "MediaFolder_parentId_fkey" 
  FOREIGN KEY ("parentId") REFERENCES "MediaFolder"("id") ON DELETE CASCADE;

-- ============================================================================
-- Create default root media folders
-- ============================================================================
INSERT INTO "MediaFolder" ("id", "name", "parentId", "path", "description", "createdBy", "createdAt") 
VALUES 
  ('root-images', 'Images', NULL, '/images', 'All image assets', 'system', CURRENT_TIMESTAMP),
  ('root-videos', 'Videos', NULL, '/videos', 'All video assets', 'system', CURRENT_TIMESTAMP),
  ('root-documents', 'Documents', NULL, '/documents', 'All document assets', 'system', CURRENT_TIMESTAMP),
  ('root-other', 'Other', NULL, '/other', 'Other file types', 'system', CURRENT_TIMESTAMP)
ON CONFLICT DO NOTHING;

-- ============================================================================
-- Create default content templates
-- ============================================================================
INSERT INTO "ContentTemplate" ("id", "name", "description", "category", "templateStructure", "isSystem", "order", "createdAt") 
VALUES 
  (
    'template-standard',
    'Standard Page',
    'Default page template with hero and content sections',
    'standard',
    '{"sections": [{"type": "hero", "required": false}, {"type": "content", "required": true}]}',
    true,
    1,
    CURRENT_TIMESTAMP
  ),
  (
    'template-landing',
    'Landing Page',
    'Marketing landing page with hero, features, testimonials, and CTA',
    'landing',
    '{"sections": [{"type": "hero", "required": true}, {"type": "features", "required": false}, {"type": "testimonials", "required": false}, {"type": "cta", "required": true}]}',
    true,
    2,
    CURRENT_TIMESTAMP
  ),
  (
    'template-blank',
    'Blank Page',
    'Empty page for full custom design',
    'custom',
    '{"sections": []}',
    true,
    3,
    CURRENT_TIMESTAMP
  )
ON CONFLICT DO NOTHING;

-- ============================================================================
-- Comments
-- ============================================================================

COMMENT ON TABLE "ContentPage" IS 'Main content pages with complete metadata and versioning';
COMMENT ON TABLE "ContentSection" IS 'Individual sections within pages for granular editing';
COMMENT ON TABLE "ContentVersion" IS 'Version control system for pages with complete snapshots';
COMMENT ON TABLE "ContentTemplate" IS 'Reusable page templates';
COMMENT ON TABLE "MediaAsset" IS 'Digital asset management for all media files';
COMMENT ON TABLE "MediaFolder" IS 'Hierarchical folder organization for media assets';
COMMENT ON TABLE "ContentWorkflow" IS 'Multi-step approval workflows for content';
COMMENT ON TABLE "ContentSchedule" IS 'Scheduled publishing and unpublishing of content';
COMMENT ON TABLE "CmsActivityLog" IS 'Comprehensive audit trail for all CMS activities';
