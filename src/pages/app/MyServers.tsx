import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useProfile } from "@/hooks/useProfile";
import { Button } from "@/components/ui/button";
import { Loader2, Plus, RefreshCw, Server, Crown, ShieldCheck, Check, ExternalLink } from "lucide-react";
import { toast } from "sonner";

type Guild = {
  id: string;
  name: string;
  icon: string | null;
  owner: boolean;
  bot_in_server: boolean;
};

const MyServers = () => {
  const { profile, isDiscordConnected } = useProfile();
  const [guilds, setGuilds] = useState<Guild[]>([]);
  const [loading, setLoading] = useState(true);
  const [clientId, setClientId] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    const [{ data, error }, cfg] = await Promise.all([
      supabase.functions.invoke("discord-user-guilds"),
      supabase.functions.invoke("discord-config"),
    ]);
    if (cfg.data?.client_id) setClientId(cfg.data.client_id);
    if (error || data?.error) {
      toast.error("Não consegui carregar seus servidores: " + (data?.error || error?.message));
      setLoading(false); return;
    }
    setGuilds(data?.guilds ?? []);
    setLoading(false);
  };

  useEffect(() => { if (isDiscordConnected) load(); else setLoading(false); }, [isDiscordConnected]);

  const buildInviteUrl = (guildId: string) => {
    if (!clientId) return "#";
    // Permissões: Send Messages, Embed Links, Read Messages, View Channels, Use External Emojis
    const perms = "274877942784";
    const params = new URLSearchParams({
      client_id: clientId,
      scope: "bot applications.commands",
      permissions: perms,
      guild_id: guildId,
      disable_guild_select: "true",
    });
    return `https://discord.com/oauth2/authorize?${params.toString()}`;
  };

  if (!isDiscordConnected) {
    return (
      <div className="max-w-xl mx-auto rounded-2xl border border-border bg-card p-8 text-center space-y-3">
        <Server className="h-10 w-10 mx-auto text-muted-foreground" />
        <h2 className="text-xl font-bold">Conecte seu Discord primeiro</h2>
        <p className="text-sm text-muted-foreground">
          Pra listar seus servidores e adicionar nosso bot, precisamos da sua conta Discord conectada.
        </p>
      </div>
    );
  }

  const withBot = guilds.filter((g) => g.bot_in_server);
  const withoutBot = guilds.filter((g) => !g.bot_in_server);

  return (
    <div className="max-w-4xl space-y-6">
      <div className="flex items-end justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-black flex items-center gap-2">
            <Server className="h-6 w-6 text-primary" /> Meus servidores
          </h1>
          <p className="text-sm text-muted-foreground">
            Servidores onde você é <b>dono</b> ou <b>administrador</b>. Adicione nosso bot pra começar a divulgar.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={load} disabled={loading} className="gap-2">
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} /> Atualizar
        </Button>
      </div>

      {loading ? (
        <div className="grid place-items-center py-20"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
      ) : guilds.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border p-10 text-center space-y-2">
          <p className="font-bold">Nenhum servidor encontrado</p>
          <p className="text-sm text-muted-foreground">Você precisa ser dono ou admin de pelo menos 1 servidor.</p>
        </div>
      ) : (
        <>
          {withoutBot.length > 0 && (
            <section className="space-y-3">
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
                  Adicionar bot ({withoutBot.length})
                </h2>
              </div>
              <div className="grid sm:grid-cols-2 gap-3">
                {withoutBot.map((g) => (
                  <ServerCard key={g.id} guild={g} inviteUrl={buildInviteUrl(g.id)} onDone={load} />
                ))}
              </div>
            </section>
          )}

          {withBot.length > 0 && (
            <section className="space-y-3">
              <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
                Bot ativo ({withBot.length})
              </h2>
              <div className="grid sm:grid-cols-2 gap-3">
                {withBot.map((g) => (
                  <ServerCard key={g.id} guild={g} inviteUrl={buildInviteUrl(g.id)} onDone={load} />
                ))}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
};

const ServerCard = ({ guild, inviteUrl, onDone }: { guild: Guild; inviteUrl: string; onDone: () => void }) => {
  const openInvite = () => {
    const win = window.open(inviteUrl, "discord-invite", "width=520,height=820");
    // Quando a janela fechar, recarrega
    const timer = setInterval(() => {
      if (win?.closed) { clearInterval(timer); setTimeout(onDone, 1500); }
    }, 800);
  };

  return (
    <div className={`rounded-xl border p-4 flex items-center gap-3 transition ${
      guild.bot_in_server ? "border-success/40 bg-success/5" : "border-border bg-card hover:border-primary/40"
    }`}>
      {guild.icon ? (
        <img src={guild.icon} alt="" className="h-12 w-12 rounded-xl shrink-0" />
      ) : (
        <div className="h-12 w-12 rounded-xl bg-secondary grid place-items-center font-black text-lg shrink-0">
          {guild.name[0]?.toUpperCase()}
        </div>
      )}
      <div className="flex-1 min-w-0">
        <div className="font-bold truncate">{guild.name}</div>
        <div className="text-[11px] text-muted-foreground flex items-center gap-1.5">
          {guild.owner ? (
            <><Crown className="h-3 w-3 text-yellow-500" /> Dono</>
          ) : (
            <><ShieldCheck className="h-3 w-3 text-primary" /> Admin</>
          )}
        </div>
      </div>
      {guild.bot_in_server ? (
        <span className="inline-flex items-center gap-1 text-xs font-bold text-success px-2 py-1 rounded-md bg-success/10">
          <Check className="h-3.5 w-3.5" /> Ativo
        </span>
      ) : (
        <Button size="sm" variant="discord" onClick={openInvite} className="gap-1.5 shrink-0">
          <Plus className="h-3.5 w-3.5" /> Adicionar
          <ExternalLink className="h-3 w-3 opacity-70" />
        </Button>
      )}
    </div>
  );
};

export default MyServers;
