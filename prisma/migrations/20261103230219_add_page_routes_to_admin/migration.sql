-- Add page_routes column to admin table for per-page access control
ALTER TABLE "admin"
  ADD COLUMN IF NOT EXISTS "page_routes" TEXT[] NOT NULL DEFAULT '{}';