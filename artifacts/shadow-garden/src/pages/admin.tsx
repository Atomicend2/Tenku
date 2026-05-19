import { useState, useEffect, useCallback } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import { Users, CreditCard, Shield, Wifi, WifiOff, Crown, Ban, Trophy, Coins, Bot, AlertTriangle, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";

export default function Admin() {
  const { isAuthenticated, token, user } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionPending, setActionPending] = useState(false);

  if (!isAuthenticated) {
    setLocation("/login");
    return null;
  }

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const base = import.meta.env.BASE_URL.replace(/\/$/, "");
      const res = await fetch(`${base}/api/v1/admin/stats`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.status === 403) {
        setError("Access denied. Staff or Owner only.");
        setLoading(false);
        return;
      }
      setData(await res.json());
    } catch {
      setError("Could not reach admin API.");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const ownerAction = async (path: string, body: any, confirm_msg: string) => {
    if (!confirm(confirm_msg)) return;
    setActionPending(true);
    try {
      const base = import.meta.env.BASE_URL.replace(/\/$/, "");
      const r = await fetch(`${base}/api/v1/admin/${path}`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const j = await r.json();
      toast({ title: j.success ? "Done" : "Error", description: j.message });
      if (j.success) fetchData();
    } finally {
      setActionPending(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 rounded-full border-2 border-primary border-t-transparent animate-spin mx-auto" />
          <p className="text-muted-foreground font-mono text-sm tracking-widest">Loading Admin Panel…</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="glass-card rounded-xl p-8 max-w-md text-center border border-rose-500/30">
          <AlertTriangle className="w-12 h-12 text-rose-400 mx-auto mb-4" />
          <h2 className="font-serif text-xl text-white mb-2">Access Restricted</h2>
          <p className="text-muted-foreground mb-6">{error}</p>
          <button onClick={fetchData} className="px-6 py-2 rounded border border-primary/30 text-primary text-sm font-bold uppercase tracking-widest hover:bg-primary/10 transition-colors">
            Retry
          </button>
        </div>
      </div>
    );
  }

  const s = data?.stats;

  return (
    <div className="min-h-screen p-4 md:p-8 max-w-7xl mx-auto space-y-8">

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <p className="text-primary/40 font-mono tracking-[0.4em] text-xs uppercase mb-1">天空</p>
          <h1 className="font-serif text-3xl md:text-4xl font-bold text-white neon-text-sky tracking-widest uppercase">Admin Panel</h1>
          <p className="text-muted-foreground mt-1 text-sm">Tenku Operational Command Centre</p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          {data?.isOwner && (
            <span className="px-3 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-400 text-xs font-bold uppercase tracking-widest flex items-center gap-1.5">
              <Crown className="w-3 h-3" /> Owner
            </span>
          )}
          <div className={cn(
            "px-3 py-1 rounded-full border text-xs font-bold uppercase tracking-widest flex items-center gap-1.5",
            data?.botConnected ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-400" : "bg-rose-500/15 border-rose-500/30 text-rose-400"
          )}>
            {data?.botConnected ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
            {data?.botConnected ? "Bot Online" : "Bot Offline"}
          </div>
          <button onClick={fetchData} className="px-3 py-1 rounded-full bg-primary/10 border border-primary/25 text-primary text-xs font-bold uppercase tracking-widest hover:bg-primary/20 transition-colors flex items-center gap-1.5">
            <RefreshCw className="w-3 h-3" /> Refresh
          </button>
        </div>
      </div>

      {/* Stat tiles */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
        <StatTile icon={Users}     label="Members"  value={s?.totalUsers}  color="text-primary" />
        <StatTile icon={Bot}       label="Bots"     value={s?.totalBots}   color="text-teal-400" />
        <StatTile icon={CreditCard}label="Cards"    value={s?.totalCards}  color="text-sky-400" />
        <StatTile icon={Shield}    label="Guilds"   value={s?.totalGuilds} color="text-amber-400" />
        <StatTile icon={Crown}     label="Staff"    value={s?.totalStaff}  color="text-violet-400" />
        <StatTile icon={Ban}       label="Banned"   value={s?.totalBanned} color="text-rose-400" />
      </div>

      {/* Economy tile */}
      <div className="glass-card rounded-xl p-5 border border-amber-500/15 flex items-center gap-5">
        <Coins className="w-10 h-10 text-amber-400 shrink-0" />
        <div>
          <p className="text-xs text-muted-foreground uppercase tracking-widest mb-1">Total Gold in Circulation</p>
          <p className="text-3xl font-mono font-bold text-amber-400">{(s?.totalBalance || 0).toLocaleString()}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

        {/* Recent Members */}
        <section>
          <h2 className="font-serif text-xl font-bold text-white mb-4 flex items-center gap-2 border-b border-primary/15 pb-3">
            <Users className="w-5 h-5 text-primary" /> Recent Members
          </h2>
          <div className="space-y-2 max-h-[420px] overflow-y-auto pr-1 custom-scroll">
            {data?.recentUsers?.length ? data.recentUsers.map((u: any) => (
              <div key={u.id} className="glass-card rounded-lg px-4 py-3 border border-white/5 flex items-center justify-between gap-3 hover:border-primary/20 transition-colors">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-serif font-bold text-sm shrink-0">
                    {u.name?.charAt(0)?.toUpperCase() || "?"}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-white truncate">{u.name || "—"}</p>
                    <p className="text-[10px] text-muted-foreground font-mono">{u.phone || u.id?.split("@")[0]}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-xs font-mono text-sky-400">Lv.{u.level}</span>
                  <span className="text-xs font-mono text-amber-400">{(u.balance || 0).toLocaleString()}g</span>
                  {u.premium ? <span className="text-[9px] text-amber-400 border border-amber-400/30 px-1 py-0.5 rounded">★</span> : null}
                </div>
              </div>
            )) : (
              <div className="py-12 text-center text-muted-foreground">No members yet.</div>
            )}
          </div>
        </section>

        <div className="space-y-8">
          {/* Top Players */}
          <section>
            <h2 className="font-serif text-xl font-bold text-white mb-4 flex items-center gap-2 border-b border-primary/15 pb-3">
              <Trophy className="w-5 h-5 text-amber-400" /> Top Players
            </h2>
            <div className="space-y-2">
              {data?.topUsers?.length ? data.topUsers.map((u: any, i: number) => (
                <div key={u.id} className="glass-card rounded-lg px-4 py-3 border border-white/5 flex items-center justify-between hover:border-amber-400/20 transition-colors">
                  <div className="flex items-center gap-3">
                    <span className={cn("font-mono text-sm font-bold w-6 text-center", [0,1,2].includes(i) ? ["text-amber-400","text-slate-300","text-amber-700"][i] : "text-muted-foreground")}>
                      {i + 1}
                    </span>
                    <p className="text-sm font-bold text-white">{u.name || "—"}</p>
                  </div>
                  <div className="flex items-center gap-3 text-xs font-mono">
                    <span className="text-sky-400">Lv.{u.level}</span>
                    <span className="text-amber-400">{(u.balance || 0).toLocaleString()}g</span>
                  </div>
                </div>
              )) : <p className="text-muted-foreground text-sm text-center py-4">No players yet.</p>}
            </div>
          </section>

          {/* Staff Roster */}
          <section>
            <h2 className="font-serif text-xl font-bold text-white mb-4 flex items-center gap-2 border-b border-primary/15 pb-3">
              <Crown className="w-5 h-5 text-violet-400" /> Staff Roster
            </h2>
            <div className="space-y-2">
              {data?.staffList?.length ? data.staffList.map((st: any, i: number) => (
                <div key={i} className="glass-card rounded-lg px-4 py-3 border border-white/5 flex items-center justify-between hover:border-violet-400/20 transition-colors">
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-white truncate">{st.name || st.user_id?.split("@")[0] || "—"}</p>
                    <p className="text-[10px] text-muted-foreground font-mono">{st.phone || "—"}</p>
                  </div>
                  <span className="text-[10px] uppercase tracking-widest font-bold px-2 py-1 rounded border border-violet-400/30 text-violet-400 bg-violet-400/10 shrink-0">
                    {st.role}
                  </span>
                </div>
              )) : <p className="text-muted-foreground text-sm text-center py-4">No staff assigned yet.</p>}
            </div>
          </section>
        </div>
      </div>

      {/* Owner danger zone */}
      {data?.isOwner && (
        <section className="glass-card rounded-xl p-6 border border-rose-500/25 bg-rose-500/5">
          <h2 className="font-serif text-xl font-bold text-rose-400 mb-2 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5" /> Owner Actions
          </h2>
          <p className="text-sm text-muted-foreground mb-6">These actions are irreversible. Confirm carefully.</p>
          <div className="flex flex-wrap gap-4">
            <button
              disabled={actionPending}
              onClick={() => ownerAction("reset-balance", {}, "Reset ALL user balances to zero? This cannot be undone.")}
              className="px-6 py-2 rounded border border-rose-500/50 text-rose-400 bg-rose-500/10 hover:bg-rose-500/20 text-sm font-bold uppercase tracking-widest transition-colors disabled:opacity-50"
            >
              Reset All Balances
            </button>
          </div>
        </section>
      )}
    </div>
  );
}

function StatTile({ icon: Icon, label, value, color }: { icon: any; label: string; value: any; color: string }) {
  return (
    <div className="glass-card rounded-xl p-5 border border-primary/8 hover:border-primary/20 transition-all">
      <Icon className={cn("w-5 h-5 mb-3", color)} />
      <p className={cn("text-2xl font-mono font-bold mb-1", color)}>{value ?? 0}</p>
      <p className="text-xs text-muted-foreground uppercase tracking-widest">{label}</p>
    </div>
  );
}
