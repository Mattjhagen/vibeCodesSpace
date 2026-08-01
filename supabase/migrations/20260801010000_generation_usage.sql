-- Ledger of AI site generations, per workspace.
--
-- Exists for two reasons that must not be conflated: a short-window RATE LIMIT
-- (stop a loop or an impatient user hammering the button) and a monthly USAGE
-- CAP (stop a plan from running up an unbounded bill). Both are enforced
-- server-side in the API route before any model call — a client-side guard on
-- spend is not a guard.
--
-- Every row is one attempt, including failed ones: a request that burned
-- tokens and then errored still cost money and must still count against the
-- cap. That is why `succeeded` is a column rather than a reason to skip the
-- insert.

CREATE TABLE IF NOT EXISTS generation_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  site_id UUID REFERENCES sites(id) ON DELETE SET NULL,
  model TEXT NOT NULL,
  input_tokens INTEGER NOT NULL DEFAULT 0,
  output_tokens INTEGER NOT NULL DEFAULT 0,
  cache_read_tokens INTEGER NOT NULL DEFAULT 0,
  cache_write_tokens INTEGER NOT NULL DEFAULT 0,
  cost_usd NUMERIC(12, 6) NOT NULL DEFAULT 0,
  succeeded BOOLEAN NOT NULL DEFAULT TRUE,
  error_kind TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Both reads are "this workspace, recent first": the rate-limit window and the
-- month-to-date sum.
CREATE INDEX IF NOT EXISTS idx_generation_usage_workspace_created
  ON generation_usage (workspace_id, created_at DESC);

ALTER TABLE generation_usage ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own generation usage" ON generation_usage;
CREATE POLICY "Users can view their own generation usage" ON generation_usage
  FOR SELECT USING (
    workspace_id IN (SELECT id FROM workspaces WHERE user_id = auth.uid())
  );

DROP POLICY IF EXISTS "Users can record their own generation usage" ON generation_usage;
CREATE POLICY "Users can record their own generation usage" ON generation_usage
  FOR INSERT WITH CHECK (
    workspace_id IN (SELECT id FROM workspaces WHERE user_id = auth.uid())
  );

-- Deliberately no UPDATE or DELETE policy. RLS default-denies, so a user
-- cannot rewrite or erase their own usage history to get back under a cap.
