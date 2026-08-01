/**
 * Per-account rate limit and usage cap for AI generation.
 *
 * Both are checked in the API route *before* the model call, because the point
 * is to prevent spend, not to record it after the fact. They answer different
 * questions and fail with different messages: the rate limit is "too fast,
 * wait", the cap is "out of budget this month, upgrade".
 *
 * Caps are keyed off the workspace's plan. A workspace with no subscription row
 * is treated as `free` — the safe direction, since an unresolvable plan should
 * grant the smallest allowance rather than an unlimited one.
 */

import type { SupabaseClient } from '@supabase/supabase-js'
import { costOf, type TokenUsage } from './generation-cost'

export type PlanTier = 'free' | 'pro' | 'business'

/** Generations allowed inside the rolling window. */
export const RATE_LIMIT_WINDOW_MINUTES = 10
export const RATE_LIMIT_PER_WINDOW: Record<PlanTier, number> = {
  free: 3,
  pro: 15,
  business: 40,
}

/** Month-to-date token allowance. Chosen so a single site (~10-20k tokens)
 *  leaves free users room to iterate a few times before hitting the wall. */
export const MONTHLY_TOKEN_CAP: Record<PlanTier, number> = {
  free: 150_000,
  pro: 2_000_000,
  business: 10_000_000,
}

export type LimitDenial = {
  allowed: false
  reason: 'rate_limited' | 'quota_exceeded'
  message: string
  retryAfterSeconds?: number
}
export type LimitCheck = { allowed: true; plan: PlanTier } | LimitDenial

function startOfMonthUtc(): string {
  const now = new Date()
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)).toISOString()
}

export async function planForWorkspace(
  supabase: SupabaseClient,
  workspaceId: string,
): Promise<PlanTier> {
  const { data } = await supabase
    .from('subscriptions')
    .select('plan, status')
    .eq('workspace_id', workspaceId)
    .maybeSingle()

  // Only an active subscription grants its tier. A past_due or cancelled row
  // falls back to free rather than continuing to bill against a paid cap.
  if (!data || data.status !== 'active') return 'free'
  const plan = data.plan as PlanTier
  return plan === 'pro' || plan === 'business' ? plan : 'free'
}

export async function checkGenerationAllowed(
  supabase: SupabaseClient,
  workspaceId: string,
): Promise<LimitCheck> {
  const plan = await planForWorkspace(supabase, workspaceId)

  const windowStart = new Date(
    Date.now() - RATE_LIMIT_WINDOW_MINUTES * 60_000,
  ).toISOString()

  const { count: recentCount, error: rateError } = await supabase
    .from('generation_usage')
    .select('id', { count: 'exact', head: true })
    .eq('workspace_id', workspaceId)
    .gte('created_at', windowStart)

  // A failed limit lookup must not silently grant access — deny and say so.
  if (rateError) {
    return {
      allowed: false,
      reason: 'rate_limited',
      message: 'Could not verify your generation allowance. Please try again.',
    }
  }

  if ((recentCount ?? 0) >= RATE_LIMIT_PER_WINDOW[plan]) {
    return {
      allowed: false,
      reason: 'rate_limited',
      message: `You can generate ${RATE_LIMIT_PER_WINDOW[plan]} sites every ${RATE_LIMIT_WINDOW_MINUTES} minutes on the ${plan} plan. Try again shortly.`,
      retryAfterSeconds: RATE_LIMIT_WINDOW_MINUTES * 60,
    }
  }

  const { data: monthRows, error: capError } = await supabase
    .from('generation_usage')
    .select('input_tokens, output_tokens, cache_read_tokens, cache_write_tokens')
    .eq('workspace_id', workspaceId)
    .gte('created_at', startOfMonthUtc())

  if (capError) {
    return {
      allowed: false,
      reason: 'quota_exceeded',
      message: 'Could not verify your monthly usage. Please try again.',
    }
  }

  const usedTokens = (monthRows ?? []).reduce(
    (sum, r) =>
      sum +
      (r.input_tokens ?? 0) +
      (r.output_tokens ?? 0) +
      (r.cache_read_tokens ?? 0) +
      (r.cache_write_tokens ?? 0),
    0,
  )

  if (usedTokens >= MONTHLY_TOKEN_CAP[plan]) {
    return {
      allowed: false,
      reason: 'quota_exceeded',
      message: `You have used your monthly AI allowance on the ${plan} plan. It resets at the start of next month.`,
    }
  }

  return { allowed: true, plan }
}

/**
 * Record one attempt. Called for failures too — a request that burned tokens
 * and then errored still cost money and still counts against the cap.
 */
export async function recordGeneration(
  supabase: SupabaseClient,
  args: {
    workspaceId: string
    siteId?: string | null
    model: string
    usage: TokenUsage
    succeeded: boolean
    errorKind?: string
  },
): Promise<void> {
  const cost = costOf(args.usage)
  const { error } = await supabase.from('generation_usage').insert({
    workspace_id: args.workspaceId,
    site_id: args.siteId ?? null,
    model: args.model,
    input_tokens: cost.inputTokens,
    output_tokens: cost.outputTokens,
    cache_read_tokens: cost.cacheReadTokens,
    cache_write_tokens: cost.cacheWriteTokens,
    cost_usd: cost.costUsd,
    succeeded: args.succeeded,
    error_kind: args.errorKind ?? null,
  })
  if (error) {
    // Losing a ledger row means the cap under-counts, so make it visible
    // rather than failing the user's request over bookkeeping.
    console.error('[generate] failed to record usage', {
      workspaceId: args.workspaceId,
      error: error.message,
    })
  }
}
