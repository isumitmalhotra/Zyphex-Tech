-- CreateFullTextSearchIndexes

-- Add full-text search support for PostgreSQL using tsvector
-- This migration creates GIN indexes for efficient text search on core models

-- ============================================================================
-- PROJECT MODEL - Full-text search on name, description
-- ============================================================================

-- Add tsvector column for Project search
ALTER TABLE "Project" ADD COLUMN IF NOT EXISTS "search_vector" tsvector;

-- Create GIN index for Project full-text search
CREATE INDEX IF NOT EXISTS "Project_search_vector_idx" ON "Project" USING GIN("search_vector");

-- Create trigger to auto-update search_vector on Project changes
CREATE OR REPLACE FUNCTION update_project_search_vector() RETURNS trigger AS $$
BEGIN
  NEW.search_vector := 
    setweight(to_tsvector('english', coalesce(NEW.name, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(NEW.description, '')), 'B');
  RETURN NEW;
END
$$ LANGUAGE plpgsql;

CREATE TRIGGER project_search_vector_update BEFORE INSERT OR UPDATE
  ON "Project" FOR EACH ROW EXECUTE FUNCTION update_project_search_vector();

-- Update existing rows
UPDATE "Project" SET "search_vector" = 
  setweight(to_tsvector('english', coalesce("name", '')), 'A') ||
  setweight(to_tsvector('english', coalesce("description", '')), 'B');

-- ============================================================================
-- TASK MODEL - Full-text search on title, description
-- ============================================================================

-- Add tsvector column for Task search
ALTER TABLE "Task" ADD COLUMN IF NOT EXISTS "search_vector" tsvector;

-- Create GIN index for Task full-text search
CREATE INDEX IF NOT EXISTS "Task_search_vector_idx" ON "Task" USING GIN("search_vector");

-- Create trigger to auto-update search_vector on Task changes
CREATE OR REPLACE FUNCTION update_task_search_vector() RETURNS trigger AS $$
BEGIN
  NEW.search_vector := 
    setweight(to_tsvector('english', coalesce(NEW.title, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(NEW.description, '')), 'B');
  RETURN NEW;
END
$$ LANGUAGE plpgsql;

CREATE TRIGGER task_search_vector_update BEFORE INSERT OR UPDATE
  ON "Task" FOR EACH ROW EXECUTE FUNCTION update_task_search_vector();

-- Update existing rows
UPDATE "Task" SET "search_vector" = 
  setweight(to_tsvector('english', coalesce("title", '')), 'A') ||
  setweight(to_tsvector('english', coalesce("description", '')), 'B');

-- ============================================================================
-- ADDITIONAL SEARCH OPTIMIZATION INDEXES
-- ============================================================================

-- Task search with status and priority
CREATE INDEX IF NOT EXISTS "Task_status_priority_search_idx" ON "Task" ("status", "priority");

-- Case-insensitive search fallback indexes
CREATE INDEX IF NOT EXISTS "Project_name_lower_idx" ON "Project" (LOWER("name"));
CREATE INDEX IF NOT EXISTS "Task_title_lower_idx" ON "Task" (LOWER("title"));
