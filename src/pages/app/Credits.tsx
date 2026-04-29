import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { Button } from "@/components/ui/button";
import { Coins, Plus, ArrowDown, ArrowUp, Sparkles, Zap, Crown, Rocket, Loader2 } from "lucide-react";
import { toast } from "sonner";

type Tx = { id: string; amount: number; type: string; description: string | null; balance_after: number; created_at: string };

const PACKAGES = [
  { credits: 100, price: "R$ 19", popular: false, icon: Zap, label: "Starter", color: "from-blue-500/20 to-cyan-500/20 border-blue-500/30", reach: "1.000 pessoas" },
  { credits: 500, price: "R$ 79", popular: true, icon: Rocket, label: "Pro", color: "from-primary/30 to-primary-glow/30 border-primary", reach: "5.000 pessoas" },
  { credits: 2000, price: "R$ 249", popular: false, icon: Crown, label: "Business", color: "from-yellow-500/20 to-orange-500/20 border-yellow-500/30", reach: "20.000 pessoas" },
];

const Credits = () => {
  const { user } = useAuth();
  const { profile, refresh } = useProfile();
  const [txs, setTxs] = useState<Tx[]>([]);
  const [buying, setBuying] = useState<number | null>(null);

  const load = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("credit_transactions")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(20);
    setTxs((data ?? []) as Tx[]);
  };

  useEffect(() => { load(); }, [user]);

  const buy = async (credits: number) => {
    setBuying(credits);
    const { error } = await supabase.functions.invoke("add-credits", { body: { amount: credits } });
    setBuying(null);
    if (error) return toast.error("Falha ao adicionar créditos");
    toast.success(`+${credits} coins adicionados!`);
    refresh();
    load();
  };

  const coins = profile?.credits ?? 0;

  return (
    <div className="max-w-5xl space-y-7">
      {/* HERO Saldo */}
      <div className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-primary via-primary to-primary-glow p-7 md:p-10 text-white shadow-glow">
        <div className="absolute -right-20 -top-20 h-72 w-72 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute -left-10 -bottom-20 h-60 w-60 rounded-full bg-white/10 blur-3xl" />
        <div className="relative">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/15 backdrop-blur text-[10px] uppercase tracking-widest font-bold mb-3">
            <Sparkles className="h-3 w-3" /> Sua carteira
          </div>
          <div className="flex items-baseline gap-2">
            <Coins className="h-7 w-7 opacity-80" />
            <span className="text-6xl md:text-7xl font-black tracking-tighter">{coins}</span>
            <span className="text-2xl font-bold opacity-70">coins</span>
          </div>
          <p className="text-sm opacity-90 mt-1">
            ≈ <strong>{(coins * 10).toLocaleString("pt-BR")}</strong> pessoas alcançáveis
          </p>
        </div>
      </div>

      {/* Pacotes */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <div className="h-7 w-7 rounded-lg bg-primary/15 grid place-items-center"><Plus className="h-4 w-4 text-primary" /></div>
          <h3 className="text-base font-black tracking-tight">Adicionar coins</h3>
          <div className="flex-1 h-px bg-border" />
        </div>
        <div className="grid sm:grid-cols-3 gap-4">
          {PACKAGES.map((p) => {
            const I = p.icon;
            return (
              <div key={p.credits} className={`relative rounded-2xl border-2 p-5 bg-gradient-to-br ${p.color} ${p.popular ? "shadow-glow" : ""} transition hover:-translate-y-1`}>
                {p.popular && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-primary text-primary-foreground text-[10px] font-black uppercase tracking-wider shadow-lg">
                    ⭐ Mais popular
                  </span>
                )}
                <div className="flex items-center gap-2 mb-3">
                  <div className="h-9 w-9 rounded-xl bg-white/10 backdrop-blur grid place-items-center">
                    <I className="h-4 w-4" />
                  </div>
                  <span className="font-black uppercase text-xs tracking-wider">{p.label}</span>
                </div>
                <div className="flex items-baseline gap-1">
                  <Coins className="h-5 w-5 text-primary" />
                  <span className="text-4xl font-black">{p.credits}</span>
                  <span className="text-xs text-muted-foreground font-bold">coins</span>
                </div>
                <div className="text-[11px] text-muted-foreground mt-1">{p.reach}</div>
                <div className="text-2xl font-black mt-3">{p.price}</div>
                <Button onClick={() => buy(p.credits)} disabled={buying !== null}
                  variant={p.popular ? "discord" : "secondary"} className="w-full mt-4 gap-1.5 font-bold">
                  {buying === p.credits ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
                  Comprar
                </Button>
              </div>
            );
          })}
        </div>
        <div className="mt-3 text-center text-[11px] text-muted-foreground bg-warning/10 border border-warning/20 rounded-lg p-2.5">
          ⚠️ Modo de teste — coins adicionados gratuitamente. Pagamento real será integrado em breve.
        </div>
      </section>

      {/* Histórico */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <div className="h-7 w-7 rounded-lg bg-secondary grid place-items-center"><ArrowDown className="h-4 w-4" /></div>
          <h3 className="text-base font-black tracking-tight">Histórico</h3>
          <div className="flex-1 h-px bg-border" />
        </div>
        {txs.length === 0 ? (
          <div className="rounded-2xl border-2 border-dashed border-border p-10 text-center text-sm text-muted-foreground">
            Nenhuma transação ainda.
          </div>
        ) : (
          <div className="rounded-2xl bg-card border border-border divide-y divide-border overflow-hidden">
            {txs.map((t) => (
              <div key={t.id} className="p-4 flex items-center gap-3 hover:bg-secondary/30 transition">
                <div className={`h-10 w-10 rounded-xl grid place-items-center ${t.amount > 0 ? "bg-success/15 text-success" : "bg-destructive/15 text-destructive"}`}>
                  {t.amount > 0 ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-bold truncate">{t.description || t.type}</div>
                  <div className="text-[11px] text-muted-foreground">{new Date(t.created_at).toLocaleString("pt-BR")}</div>
                </div>
                <div className="text-right">
                  <div className={`font-black text-base ${t.amount > 0 ? "text-success" : "text-destructive"}`}>{t.amount > 0 ? "+" : ""}{t.amount}</div>
                  <div className="text-[10px] text-muted-foreground">saldo: {t.balance_after}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

export default Credits;
