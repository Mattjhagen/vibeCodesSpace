'use server'

import { createClient } from '@/utils/supabase/server'

/** Mirrors the bucket's allowed_mime_types. SVG is excluded on purpose. */
const ALLOWED = ['image/png', 'image/jpeg', 'image/webp', 'image/gif', 'image/avif']
const MAX_BYTES = 5 * 1024 * 1024

const EXTENSIONS: Record<string, string> = {
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/webp': 'webp',
  'image/gif': 'gif',
  'image/avif': 'avif',
}

export type UploadResult =
  | { ok: true; url: string }
  | { ok: false; error: string }

/**
 * Upload one image for a site and return its public URL.
 *
 * The object key is derived server-side from the site's own workspace, never
 * from anything the client sent — the storage policy authorises on that first
 * path segment, so letting the caller choose it would let anyone write into
 * another tenant's folder.
 *
 * The filename is generated rather than taken from the upload: user-supplied
 * names bring path traversal and content-sniffing problems for no benefit,
 * since the display name lives in the block's alt text.
 */
export async function uploadSiteImage(
  siteId: string,
  formData: FormData,
): Promise<UploadResult> {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: 'Not signed in.' }

  const file = formData.get('file')
  if (!(file instanceof File)) return { ok: false, error: 'No file received.' }
  if (file.size === 0) return { ok: false, error: 'That file is empty.' }
  if (file.size > MAX_BYTES) {
    return { ok: false, error: `Images must be under ${MAX_BYTES / 1024 / 1024} MB.` }
  }
  if (!ALLOWED.includes(file.type)) {
    return {
      ok: false,
      error: `Unsupported image type (${file.type || 'unknown'}). Use PNG, JPEG, WebP, GIF or AVIF.`,
    }
  }

  // RLS on `sites` means this returns nothing unless the caller owns it, so
  // the lookup doubles as the authorisation check.
  const { data: site } = await supabase
    .from('sites')
    .select('id, workspace_id')
    .eq('id', siteId)
    .maybeSingle()
  if (!site) return { ok: false, error: 'Site not found.' }

  const ext = EXTENSIONS[file.type] ?? 'bin'
  const key = `${site.workspace_id}/${site.id}/${crypto.randomUUID()}.${ext}`

  const { error } = await supabase.storage
    .from('site-media')
    .upload(key, file, { contentType: file.type, upsert: false })

  if (error) {
    console.error('Site image upload failed:', error)
    return { ok: false, error: error.message }
  }

  const { data } = supabase.storage.from('site-media').getPublicUrl(key)
  return { ok: true, url: data.publicUrl }
}
