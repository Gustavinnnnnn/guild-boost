
-- Drop policies primeiro
DROP POLICY IF EXISTS "Users delete own discord_servers" ON public.discord_servers;
DROP POLICY IF EXISTS "Users insert own discord_servers" ON public.discord_servers;
DROP POLICY IF EXISTS "Users update own discord_servers" ON public.discord_servers;
DROP POLICY IF EXISTS "Users view own discord_servers" ON public.discord_servers;

-- Limpar dados antigos
DELETE FROM public.campaigns;
DELETE FROM public.discord_servers;

-- 1. Refatorar discord_servers
ALTER TABLE public.discord_servers DROP COLUMN IF EXISTS user_id;
ALTER TABLE public.discord_servers DROP COLUMN IF EXISTS default_channel_id;
ALTER TABLE public.discord_servers DROP COLUMN IF EXISTS default_channel_name;
ALTER TABLE public.discord_servers ADD COLUMN IF NOT EXISTS owner_discord_id TEXT;
ALTER TABLE public.discord_servers ADD COLUMN IF NOT EXISTS last_synced_at TIMESTAMPTZ DEFAULT now();
ALTER TABLE public.discord_servers ADD CONSTRAINT discord_servers_guild_id_unique UNIQUE (guild_id);

CREATE POLICY "Authenticated users can view network"
ON public.discord_servers FOR SELECT
TO authenticated
USING (true);

-- 2. Profiles: créditos
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS credits INTEGER NOT NULL DEFAULT 100;

-- 3. Refatorar campaigns
ALTER TABLE public.campaigns DROP COLUMN IF EXISTS server_id;
ALTER TABLE public.campaigns DROP COLUMN IF EXISTS channel_id;
ALTER TABLE public.campaigns DROP COLUMN IF EXISTS channel_name;
ALTER TABLE public.campaigns ADD COLUMN IF NOT EXISTS title TEXT NOT NULL DEFAULT '';
ALTER TABLE public.campaigns ADD COLUMN IF NOT EXISTS button_label TEXT;
ALTER TABLE public.campaigns ADD COLUMN IF NOT EXISTS button_url TEXT;
ALTER TABLE public.campaigns ADD COLUMN IF NOT EXISTS total_targeted INTEGER NOT NULL DEFAULT 0;
ALTER TABLE public.campaigns ADD COLUMN IF NOT EXISTS total_delivered INTEGER NOT NULL DEFAULT 0;
ALTER TABLE public.campaigns ADD COLUMN IF NOT EXISTS total_failed INTEGER NOT NULL DEFAULT 0;
ALTER TABLE public.campaigns ADD COLUMN IF NOT EXISTS total_clicks INTEGER NOT NULL DEFAULT 0;
ALTER TABLE public.campaigns ADD COLUMN IF NOT EXISTS credits_spent INTEGER NOT NULL DEFAULT 0;

-- 4. campaign_deliveries
CREATE TABLE IF NOT EXISTS public.campaign_deliveries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  recipient_discord_id TEXT NOT NULL,
  guild_id TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  error_message TEXT,
  clicked_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_deliveries_campaign ON public.campaign_deliveries(campaign_id);
CREATE INDEX IF NOT EXISTS idx_deliveries_user ON public.campaign_deliveries(user_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_deliveries_unique ON public.campaign_deliveries(campaign_id, recipient_discord_id);

ALTER TABLE public.campaign_deliveries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own deliveries" ON public.campaign_deliveries
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- 5. credit_transactions
CREATE TABLE IF NOT EXISTS public.credit_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  amount INTEGER NOT NULL,
  type TEXT NOT NULL,
  description TEXT,
  campaign_id UUID REFERENCES public.campaigns(id) ON DELETE SET NULL,
  balance_after INTEGER NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_credit_tx_user ON public.credit_transactions(user_id, created_at DESC);

ALTER TABLE public.credit_transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own transactions" ON public.credit_transactions
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
