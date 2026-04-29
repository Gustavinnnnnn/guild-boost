import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Loader2, RefreshCw, Server, Users } from "lucide-react";
import { toast } from "sonner";

type NetworkServer = {
  id: string;
  guild_id: string;
  name: string;
  icon_url: string | null;
  member_count: number;
  last_synced_at: string;
};

const Network = () => {
  const [servers, setServers] = useState<NetworkServer[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);

  const load = async () => {
    const { data } = await supabase
      .from("discord_servers")
      .select("id, guild_id, name, icon_url, member_count, last_synced_at")
      .order("member_count", { ascending: false });
    setServers((data ?? []) as NetworkServer[]);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const sync = async () => {
    setSyncing(true);
    const { data, error } = await supabase.functions.invoke("bot-sync-guilds");
    setSyncing(false);
    if (error || data?.error) {
      toast.error("Falha ao sincronizar: " + (data?.error || error?.message || "erro"));
      return;
    }
    toast.success(`Sincronizado! ${data.synced} servidores na rede.`);
    load();
  };

  const totalMembers = servers.reduce((s, x) => s + (x.member_count || 0), 0);

  return (
    <div className="max-w-6xl space-y-6">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h2 className="text-xl font-bold">Rede do bot</h2>
          <p className="text-sm text-muted-foreground">Servidores onde o bot está ativo — sua audiência total para campanhas.</p>
        </div>
        <Button onClick={sync} disabled={syncing} variant="discord" className="gap-2">
          <RefreshCw className={`h-4 w-4 ${syncing ? "animate-spin" : ""}`} />
          {syncing ? "Sincronizando..." : "Sincronizar rede"}
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-xl bg-card border border-border p-5">
          <div className="flex items-center gap-2 text-muted-foreground text-xs uppercase tracking-wider"><Server className="h-3.5 w-3.5" /> Servidores</div>
          <div className="text-3xl font-bold mt-2">{servers.length}</div>
        </div>
        <div className="rounded-xl bg-card border border-border p-5">
          <div className="flex items-center gap-2 text-muted-foreground text-xs uppercase tracking-wider"><Users className="h-3.5 w-3.5" /> Membros alcançáveis</div>
          <div className="text-3xl font-bold mt-2">{totalMembers.toLocaleString("pt-BR")}</div>
        </div>
      </div>

      {loading ? (
        <div className="grid place-items-center py-16"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
      ) : servers.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-12 text-center">
          <p className="text-sm text-muted-foreground mb-4">Nenhum servidor na rede ainda. Sincronize para puxar onde o bot está.</p>
          <Button onClick={sync} disabled={syncing} variant="discord" className="gap-2">
            <RefreshCw className={`h-4 w-4 ${syncing ? "animate-spin" : ""}`} /> Sincronizar agora
          </Button>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {servers.map((s) => (
            <div key={s.id} className="rounded-xl bg-card border border-border p-4 flex items-center gap-3">
              {s.icon_url ? (
                <img src={s.icon_url} className="h-12 w-12 rounded-xl" alt="" />
              ) : (
                <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-primary to-primary-glow grid place-items-center text-white font-bold">{s.name[0]}</div>
              )}
              <div className="flex-1 min-w-0">
                <div className="font-semibold truncate">{s.name}</div>
                <div className="text-xs text-muted-foreground flex items-center gap-1"><Users className="h-3 w-3" /> {s.member_count.toLocaleString("pt-BR")} membros</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Network;
