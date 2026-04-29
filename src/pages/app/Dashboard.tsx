import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { Button } from "@/components/ui/button";
import { Coins, Megaphone, Server, Send, MousePointerClick, Plus, Users } from "lucide-react";

const Stat = ({ icon: Icon, label, value, accent }: { icon: any; label: string; value: string | number; accent?: string }) => (
  <div className="rounded-xl bg-card border border-border p-5">
    <div className="flex items-center gap-2 text-muted-foreground text-xs uppercase tracking-wider"><Icon className="h-3.5 w-3.5" /> {label}</div>
    <div className={`text-3xl font-bold mt-2 ${accent ?? ""}`}>{value}</div>
  </div>
);

const Dashboard = () => {
  const { user } = useAuth();
  const { profile } = useProfile();
  const [stats, setStats] = useState({ servers: 0, members: 0, sent: 0, delivered: 0, clicks: 0, campaigns: 0 });

  useEffect(() => {
    if (!user) return;
    (async () => {
      const [{ data: servers }, { data: campaigns }] = await Promise.all([
        supabase.from("discord_servers").select("member_count"),
        supabase.from("campaigns").select("total_delivered, total_clicks, status").eq("user_id", user.id),
      ]);
      const members = (servers ?? []).reduce((s, x: any) => s + (x.member_count || 0), 0);
      const delivered = (campaigns ?? []).reduce((s, x: any) => s + (x.total_delivered || 0), 0);
      const clicks = (campaigns ?? []).reduce((s, x: any) => s + (x.total_clicks || 0), 0);
      const sent = (campaigns ?? []).filter((c: any) => c.status === "sent").length;
      setStats({ servers: servers?.length ?? 0, members, sent, delivered, clicks, campaigns: campaigns?.length ?? 0 });
    })();
  }, [user]);

  const ctr = stats.delivered > 0 ? ((stats.clicks / stats.delivered) * 100).toFixed(1) : "0.0";

  return (
    <div className="max-w-6xl space-y-6">
      {/* Hero credits card */}
      <div className="rounded-2xl bg-gradient-to-br from-primary to-primary-glow p-6 md:p-8 text-white relative overflow-hidden">
        <div className="absolute -right-10 -top-10 h-48 w-48 rounded-full bg-white/10 blur-2xl" />
        <div className="relative flex items-start justify-between gap-4 flex-wrap">
          <div>
            <div className="text-xs uppercase tracking-widest opacity-80 flex items-center gap-1.5"><Coins className="h-3.5 w-3.5" /> Saldo de créditos</div>
            <div className="text-5xl md:text-6xl font-black mt-2">{profile?.credits ?? 0}</div>
            <p className="text-sm opacity-90 mt-1">1 crédito = 1 mensagem entregue</p>
          </div>
          <div className="flex gap-2">
            <Link to="/app/creditos"><Button variant="secondary" className="gap-2"><Plus className="h-4 w-4" /> Adicionar</Button></Link>
            <Link to="/app/campanhas/nova"><Button className="bg-white text-primary hover:bg-white/90 gap-2"><Megaphone className="h-4 w-4" /> Nova campanha</Button></Link>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Stat icon={Server} label="Servidores na rede" value={stats.servers} />
        <Stat icon={Users} label="Membros alcançáveis" value={stats.members.toLocaleString("pt-BR")} />
        <Stat icon={Send} label="Campanhas enviadas" value={stats.sent} />
        <Stat icon={MousePointerClick} label="CTR" value={`${ctr}%`} accent="text-success" />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Stat icon={Send} label="Total entregues" value={stats.delivered.toLocaleString("pt-BR")} />
        <Stat icon={MousePointerClick} label="Total cliques" value={stats.clicks.toLocaleString("pt-BR")} />
      </div>

      <div className="rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
        Pronto para divulgar? <Link to="/app/campanhas/nova" className="text-primary font-semibold underline">Criar campanha</Link>
      </div>
    </div>
  );
};

export default Dashboard;
