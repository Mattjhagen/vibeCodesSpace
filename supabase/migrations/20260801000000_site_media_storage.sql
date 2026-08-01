-- Storage for images placed in site content.
--
-- Objects are keyed <workspace_id>/<site_id>/<filename>, and every policy below
-- authorises on that first path segment. Supabase storage has no foreign keys,
-- so the workspace id in the path IS the ownership claim -- which is exactly
-- why it has to be checked against the workspaces table on write rather than
-- trusted because the client sent it.

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'site-media',
  'site-media',
  -- Public read: a published site is served to anonymous visitors, so its
  -- images cannot require a session. Writes stay locked down below.
  TRUE,
  5242880,  -- 5 MB
  ARRAY['image/png', 'image/jpeg', 'image/webp', 'image/gif', 'image/avif']
)
ON CONFLICT (id) DO UPDATE
  SET public = EXCLUDED.public,
      file_size_limit = EXCLUDED.file_size_limit,
      allowed_mime_types = EXCLUDED.allowed_mime_types;

-- SVG is deliberately absent from allowed_mime_types. An SVG is a document
-- that can carry script, and these are served from a bucket origin, so
-- permitting them would reintroduce exactly the injection route that
-- sanitizeImageSrc() rejects data:image/svg+xml for.

DROP POLICY IF EXISTS "site_media_public_read" ON storage.objects;
CREATE POLICY "site_media_public_read" ON storage.objects
  FOR SELECT
  USING (bucket_id = 'site-media');

DROP POLICY IF EXISTS "site_media_owner_insert" ON storage.objects;
CREATE POLICY "site_media_owner_insert" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'site-media'
    AND (storage.foldername(name))[1] IN (
      SELECT id::text FROM public.workspaces WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "site_media_owner_update" ON storage.objects;
CREATE POLICY "site_media_owner_update" ON storage.objects
  FOR UPDATE TO authenticated
  USING (
    bucket_id = 'site-media'
    AND (storage.foldername(name))[1] IN (
      SELECT id::text FROM public.workspaces WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "site_media_owner_delete" ON storage.objects;
CREATE POLICY "site_media_owner_delete" ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'site-media'
    AND (storage.foldername(name))[1] IN (
      SELECT id::text FROM public.workspaces WHERE user_id = auth.uid()
    )
  );
