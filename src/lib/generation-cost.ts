/**
 * Token accounting for site generation.
 *
 * Pure functions over a usage object so cost is testable without an API call,
 * and so the number written to the usage ledger is the same one shown to the
 * user. Rates are per million tokens, in USD.
 */

export const MODEL = 'claude-opus-5' as const

/** Claude Opus 5 list pricing. */
export const RATES = {
  inputPerMTok: 5.0,
  outputPerMTok: 25.0,
  /** Cache reads bill at ~0.1x input. */
  cacheReadPerMTok: 0.5,
  /** 5-minute-TTL cache writes bill at ~1.25x input. */
  cacheWritePerMTok: 6.25,
} as const

export interface TokenUsage {
  input_tokens: number
  output_tokens: number
  cache_read_input_tokens?: number | null
  cache_creation_input_tokens?: number | null
}

export interface CostBreakdown {
  inputTokens: number
  outputTokens: number
  cacheReadTokens: number
  cacheWriteTokens: number
  /** Everything billable, for quota purposes. */
  totalTokens: number
  costUsd: number
}

export function costOf(usage: TokenUsage): CostBreakdown {
  const inputTokens = usage.input_tokens ?? 0
  const outputTokens = usage.output_tokens ?? 0
  const cacheReadTokens = usage.cache_read_input_tokens ?? 0
  const cacheWriteTokens = usage.cache_creation_input_tokens ?? 0

  const costUsd =
    (inputTokens / 1_000_000) * RATES.inputPerMTok +
    (outputTokens / 1_000_000) * RATES.outputPerMTok +
    (cacheReadTokens / 1_000_000) * RATES.cacheReadPerMTok +
    (cacheWriteTokens / 1_000_000) * RATES.cacheWritePerMTok

  return {
    inputTokens,
    outputTokens,
    cacheReadTokens,
    cacheWriteTokens,
    totalTokens: inputTokens + outputTokens + cacheReadTokens + cacheWriteTokens,
    // Sub-cent precision matters: a single generation costs a few cents, so
    // rounding to cents would floor most of them to $0.00 in the ledger.
    costUsd: Math.round(costUsd * 1e6) / 1e6,
  }
}

export function formatUsd(value: number): string {
  return value < 0.01 ? `$${value.toFixed(4)}` : `$${value.toFixed(2)}`
}
