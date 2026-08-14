-- Add favicon and tab title customization to sites
ALTER TABLE sites
  ADD COLUMN IF NOT EXISTS favicon_url TEXT,
  ADD COLUMN IF NOT EXISTS tab_title   TEXT;
