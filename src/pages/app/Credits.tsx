import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { Button } from "@/components/ui/button";
import { Coins, Plus, ArrowDown, ArrowUp } from "lucide-react";
import { toast } from "sonner";

type Tx = { id: string; amount: number; type: string; description: string | null; balance_after: number; created_at: string };

const PACKAGES = [
  { credits: 100, price: "R$ 19", popular: false },
  { credits: 500, price: "R$ 79", popular: true },
  { credits: 2000, price: "R$ 249", popular: false },
];

const Credits = () => {
  const { user } = useAuth();
  const { profile, refresh } = useProfile();
  const [txs, setTxs] = useState<Tx[]>([]);

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
    // Stub — sem pagamento real ainda
    const { error } = await supabase.functions.invoke("add-credits", { body: { amount: credits } });
    if (error) return toast.error("Falha ao adicionar créditos");
    toast.success(`+${credits} créditos adicionados!`);
    refresh();
    load();
  };

  return (
    <div className="max-w-4xl space-y-6">
      {/* Saldo */}
      <div className="rounded-2xl bg-gradient-to-br from-primary to-primary-glow p-6 text-white relative overflow-hidden">
        <div className="absolute -right-10 -top-10 h-48 w-48 rounded-full bg-white/10 blur-2xl" />
        <div className="relative">
          <div className="text-xs uppercase tracking-widest opacity-80 flex items-center gap-1.5"><Coins className="h-3.5 w-3.5" /> Saldo</div>
          <div className="text-5xl font-black mt-2">{profile?.credits ?? 0}</div>
        </div>
      </div>

      {/* Pacotes */}
      <div>
        <h3 className="text-lg font-bold mb-3">Adicionar créditos</h3>
        <div className="grid sm:grid-cols-3 gap-3">
          {PACKAGES.map((p) => (
            <div key={p.credits} className={`rounded-xl border p-5 relative ${p.popular ? "border-primary bg-primary/5" : "border-border bg-card"}`}>
              {p.popular && <span className="absolute -top-2 left-4 px-2 py-0.5 rounded-full bg-primary text-primary-foreground text-[10px] font-bold uppercase">Popular</span>}
              <div className="text-3xl font-black">{p.credits}</div>
              <div className="text-xs text-muted-foreground uppercase tracking-wider mt-1">créditos</div>
              <div className="text-xl font-semibold mt-3">{p.price}</div>
              <Button onClick={() => buy(p.credits)} variant={p.popular ? "discord" : "secondary"} className="w-full mt-4 gap-1.5">
                <Plus className="h-3.5 w-3.5" /> Comprar
              </Button>
            </div>
          ))}
        </div>
        <p className="text-xs text-muted-foreground mt-2">⚠️ Pagamento em modo de teste — créditos são adicionados gratuitamente por enquanto.</p>
      </div>

      {/* Histórico */}
      <div>
        <h3 className="text-lg font-bold mb-3">Histórico</h3>
        {txs.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">Nenhuma transação ainda.</div>
        ) : (
          <div className="rounded-xl bg-card border border-border divide-y divide-border">
            {txs.map((t) => (
              <div key={t.id} className="p-4 flex items-center gap-3">
                <div className={`h-9 w-9 rounded-full grid place-items-center ${t.amount > 0 ? "bg-success/15 text-success" : "bg-destructive/15 text-destructive"}`}>
                  {t.amount > 0 ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold truncate">{t.description || t.type}</div>
                  <div className="text-xs text-muted-foreground">{new Date(t.created_at).toLocaleString("pt-BR")}</div>
                </div>
                <div className="text-right">
                  <div className={`font-bold ${t.amount > 0 ? "text-success" : "text-destructive"}`}>{t.amount > 0 ? "+" : ""}{t.amount}</div>
                  <div className="text-[10px] text-muted-foreground">saldo: {t.balance_after}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Credits;
