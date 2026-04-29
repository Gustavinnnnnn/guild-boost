-- Sistema agora trata `profiles.credits` como CENTAVOS de R$ (1 DM = 2 centavos = R$ 0,02)
-- Atualiza default e converte saldos antigos (que estavam em "coins", 1 coin = 10 DMs = 20 centavos)
ALTER TABLE public.profiles ALTER COLUMN credits SET DEFAULT 5000;

-- Converte saldos existentes pequenos (provavelmente do default antigo de 50 coins) pra centavos equivalentes
-- Heurística: se credits < 1000, multiplica por 100 (assume eram unidades pequenas de teste); senão deixa
UPDATE public.profiles SET credits = credits * 100 WHERE credits < 1000;