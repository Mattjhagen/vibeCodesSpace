/**
 * AI site generation. Server-only.
 *
 * The Anthropic client is constructed here, in a route handler, and the key
 * never crosses into anything the browser downloads — there is deliberately no
 * NEXT_PUBLIC_ variant of it and no client component imports this module.
 *
 * Streams NDJSON back to the caller: one JSON object per line, so the UI can
 * show progress while a generation that takes tens of seconds runs. The last
 * line is always either a `done` or an `error` event — never nothing, and never
 * a blank site.
 */

import Anthropic from '@anthropic-ai/sdk'
import { zodOutputFormat } from '@anthropic-ai/sdk/helpers/zod'
import { createClient } from '@/utils/supabase/server'
import { SITE_TYPES, SiteType, parseSiteContent } from '@/lib/content-model'
import { MODEL, costOf, type TokenUsage } from '@/lib/generation-cost'
import { checkGenerationAllowed, recordGeneration } from '@/lib/generation-limits'
import {
  GENERATION_SYSTEM_PROMPT,
  generatedSite,
  generationUserPrompt,
} from '@/lib/generation-schema'

/** Thinking is on by default on this model and shares the budget with output,
 *  so this has to cover both. Streaming means a large value costs nothing
 *  unless it is used. */
const MAX_TOKENS = 32_000

type Event =
  | { type: 'status'; message: string }
  | { type: 'delta'; text: string }
  | { type: 'done'; site: unknown; usage: ReturnType<typeof costOf> }
  | { type: 'error'; error: string; reason: string }

export async function POST(req: Request) {
  const encoder = new TextEncoder()
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return Response.json({ error: 'Not signed in.' }, { status: 401 })
  }

  let body: { siteId?: string; siteType?: string; name?: string; brief?: string }
  try {
    body = await req.json()
  } catch {
    return Response.json({ error: 'Malformed request body.' }, { status: 400 })
  }

  const siteType: SiteType = SITE_TYPES.includes(body.siteType as SiteType)
    ? (body.siteType as SiteType)
    : 'business'
  const name = (body.name ?? '').trim().slice(0, 200)
  const brief = (body.brief ?? '').trim().slice(0, 4000)
  if (!name) {
    return Response.json({ error: 'A site name is required.' }, { status: 400 })
  }

  // Resolve the workspace through RLS: an unowned siteId simply returns no row,
  // so this doubles as the authorization check for generating into that site.
  let workspaceId: string | null = null
  let siteId: string | null = null
  if (body.siteId) {
    const { data: site } = await supabase
      .from('sites')
      .select('id, workspace_id')
      .eq('id', body.siteId)
      .maybeSingle()
    if (!site) {
      return Response.json({ error: 'Site not found.' }, { status: 404 })
    }
    workspaceId = site.workspace_id
    siteId = site.id
  } else {
    const { data: ws } = await supabase
      .from('workspaces')
      .select('id')
      .eq('user_id', user.id)
      .limit(1)
      .maybeSingle()
    if (!ws) {
      return Response.json({ error: 'No workspace found.' }, { status: 400 })
    }
    workspaceId = ws.id
  }

  // Spend controls run before the model call, not after.
  const limit = await checkGenerationAllowed(supabase, workspaceId!)
  if (!limit.allowed) {
    return Response.json(
      { error: limit.message, reason: limit.reason },
      {
        status: limit.reason === 'rate_limited' ? 429 : 402,
        headers: limit.retryAfterSeconds
          ? { 'Retry-After': String(limit.retryAfterSeconds) }
          : undefined,
      },
    )
  }

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const send = (event: Event) =>
        controller.enqueue(encoder.encode(JSON.stringify(event) + '\n'))

      let usage: TokenUsage = { input_tokens: 0, output_tokens: 0 }
      let errorKind: string | undefined

      try {
        send({ type: 'status', message: 'Generating your site…' })

        // Zero-arg client: resolves ANTHROPIC_API_KEY, ANTHROPIC_AUTH_TOKEN, or
        // an `ant auth login` profile. Never a NEXT_PUBLIC_ value.
        const anthropic = new Anthropic()

        const modelStream = anthropic.messages.stream({
          model: MODEL,
          max_tokens: MAX_TOKENS,
          system: GENERATION_SYSTEM_PROMPT,
          output_config: {
            // Well-specified task — medium is the cost/quality sweet spot here.
            effort: 'medium',
            format: zodOutputFormat(generatedSite),
          },
          messages: [
            { role: 'user', content: generationUserPrompt(siteType, name, brief) },
          ],
        })

        // Forward text deltas so the UI has something to show. This is the raw
        // JSON being built; the client uses it for progress, not for parsing.
        modelStream.on('text', (delta) => send({ type: 'delta', text: delta }))

        const message = await modelStream.finalMessage()
        usage = message.usage as TokenUsage

        if (message.stop_reason === 'refusal') {
          throw new GenerationError(
            'refusal',
            'The model declined to generate this content. Try rewording the description.',
          )
        }
        if (message.stop_reason === 'max_tokens') {
          throw new GenerationError(
            'max_tokens',
            'The site was too large to finish generating. Try a shorter description.',
          )
        }

        const raw = message.content
          .filter((b): b is Anthropic.TextBlock => b.type === 'text')
          .map((b) => b.text)
          .join('')

        let parsedJson: unknown
        try {
          parsedJson = JSON.parse(raw)
        } catch {
          throw new GenerationError(
            'invalid_json',
            'The model returned malformed data. Please try again.',
          )
        }

        const validated = generatedSite.safeParse(parsedJson)
        if (!validated.success) {
          throw new GenerationError(
            'schema_mismatch',
            'The generated site did not match the expected structure. Please try again.',
          )
        }

        // Second layer: sanitize URLs, cap lengths, de-duplicate slugs and
        // assign ids. Structured output guarantees shape, not safety.
        const site = parseSiteContent({ ...validated.data, theme: 'minimal' })
        if (!site.pages.length) {
          throw new GenerationError(
            'empty_site',
            'The generated site had no usable pages. Please try again.',
          )
        }

        await recordGeneration(supabase, {
          workspaceId: workspaceId!,
          siteId,
          model: MODEL,
          usage,
          succeeded: true,
        })

        send({ type: 'done', site, usage: costOf(usage) })
      } catch (err) {
        const { kind, message } = describeError(err)
        errorKind = kind

        // A failed attempt that burned tokens still counts against the cap.
        if (usage.input_tokens || usage.output_tokens) {
          await recordGeneration(supabase, {
            workspaceId: workspaceId!,
            siteId,
            model: MODEL,
            usage,
            succeeded: false,
            errorKind,
          })
        }

        console.error('[generate] failed', { kind, workspaceId, error: String(err) })
        // Surfaced as an error event, never as an empty site.
        send({ type: 'error', error: message, reason: kind })
      } finally {
        controller.close()
      }
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'application/x-ndjson; charset=utf-8',
      'Cache-Control': 'no-store',
    },
  })
}

class GenerationError extends Error {
  constructor(public kind: string, message: string) {
    super(message)
  }
}

/** Map anything thrown into a stable kind plus a message safe to show a user. */
function describeError(err: unknown): { kind: string; message: string } {
  if (err instanceof GenerationError) return { kind: err.kind, message: err.message }
  if (err instanceof Anthropic.RateLimitError) {
    return {
      kind: 'upstream_rate_limit',
      message: 'The AI service is busy right now. Please try again in a moment.',
    }
  }
  if (err instanceof Anthropic.AuthenticationError) {
    return {
      kind: 'auth',
      message: 'Site generation is not configured correctly. Please contact support.',
    }
  }
  if (err instanceof Anthropic.APIConnectionError) {
    return {
      kind: 'connection',
      message: 'Could not reach the AI service. Please try again.',
    }
  }
  if (err instanceof Anthropic.APIError) {
    return {
      kind: `api_${err.status ?? 'error'}`,
      message: 'The AI service returned an error. Please try again.',
    }
  }
  return { kind: 'unknown', message: 'Something went wrong generating your site.' }
}
