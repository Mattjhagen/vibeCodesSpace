-- Grant mattjhagen0@gmail.com permanent business-tier access.
-- This upserts a subscription row so it survives re-runs and won't
-- create a duplicate if the workspace already has a subscription.

DO $$
DECLARE
  v_user_id   UUID;
  v_workspace UUID;
BEGIN
  -- Look up the auth user by email
  SELECT id INTO v_user_id
  FROM auth.users
  WHERE email = 'mattjhagen0@gmail.com'
  LIMIT 1;

  IF v_user_id IS NULL THEN
    RAISE NOTICE 'mattjhagen0@gmail.com not found — skipping (user may not have signed in yet)';
    RETURN;
  END IF;

  -- Find their workspace (owner_id matches in workspaces table)
  SELECT id INTO v_workspace
  FROM workspaces
  WHERE owner_id = v_user_id
  LIMIT 1;

  IF v_workspace IS NULL THEN
    RAISE NOTICE 'No workspace found for mattjhagen0@gmail.com — skipping';
    RETURN;
  END IF;

  -- Upsert a permanent active business subscription
  INSERT INTO subscriptions (workspace_id, plan, status)
  VALUES (v_workspace, 'business', 'active')
  ON CONFLICT (workspace_id)
  DO UPDATE SET
    plan   = 'business',
    status = 'active';

  RAISE NOTICE 'Business plan granted to mattjhagen0@gmail.com (workspace: %)', v_workspace;
END;
$$;
