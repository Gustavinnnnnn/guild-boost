-- Adiciona suporte a múltiplos nichos por campanha
ALTER TABLE public.campaigns
  ADD COLUMN IF NOT EXISTS target_niches text[] NOT NULL DEFAULT '{}';

-- Adiciona campo de nicho granular nos servidores
ALTER TABLE public.discord_servers
  ADD COLUMN IF NOT EXISTS niche text DEFAULT 'server_general';

CREATE INDEX IF NOT EXISTS idx_discord_servers_niche ON public.discord_servers(niche);
CREATE INDEX IF NOT EXISTS idx_campaigns_target_niches ON public.campaigns USING GIN(target_niches);