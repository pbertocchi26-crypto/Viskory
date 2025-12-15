/*
  # Add Brand Story Fields

  1. Changes
    - Add `story_title` text field for brand story title
    - Add `story_content` text field for brand story content (long text)
    - Add `story_images` text array field for story image URLs
  
  2. Purpose
    - Enable brands to tell their story on public profile pages
    - Support multiple images to illustrate brand story
    - Optional fields that enhance brand presentation
*/

-- Add story fields to brands table
ALTER TABLE brands ADD COLUMN IF NOT EXISTS story_title text;
ALTER TABLE brands ADD COLUMN IF NOT EXISTS story_content text;
ALTER TABLE brands ADD COLUMN IF NOT EXISTS story_images text[];

-- Add index for brands with stories (for potential future features)
CREATE INDEX IF NOT EXISTS idx_brands_has_story 
ON brands (id) 
WHERE story_title IS NOT NULL OR story_content IS NOT NULL;
