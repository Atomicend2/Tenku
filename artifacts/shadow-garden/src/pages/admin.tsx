import { useState, useEffect, useCallback } from "react";
import { useToast } from "@/hooks/use-toast";
import {
  Users, CreditCard, Shield, Wifi, WifiOff, Crown, Ban,
  Trophy, Coins, Bot, AlertTriangle, RefreshCw, Lock, Plus, Trash2, Eye, EyeOff,
} from "lucide-react";
import { cn } from "@/lib/utils";

const ADMIN_TOKEN_KEY = "tenku_admin_token";

function getAdminToken(): string | null {
  return localStorage.getItem(ADMIN_TOKEN_KEY);
}

function setAdminToken(t: string) {
  localStorage.setItem(ADMIN_TOKEN_KEY, t);
}

function clearAdminToken() {
  localStorage.removeItem(ADMIN_TOKEN_KEY);
}

function useAdminToken() {
  const [token, setToken] = useState<string | null>(() => getAdminToken());
  const save = (t: string) => { setAdminToken(t); setToken(t); };
  const clear = () => { clearAdminToken(); setToken(null); };
  return { token, save, clear };
}

export default function Admin() {
  const { token, save: saveToken, clear: clearToken } = useAdminToken();
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const { toast } = useToast();

  const base = import.meta.env.BASE_URL.replace(/\/$/, "");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginLoading(true);
    setLoginError(null);
    try {
      const res = await fetch(`${base}/api/v1/admin/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const j = await res.json();
      if (j.success && j.token) {
        saveToken(j.token);
        setPassword("");
      } else {
        setLoginError(j.message || "Invalid password.");
      }
    } catch {
      setLoginError("Could not reach the server.");
    } finally {
      setLoginLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-background">
        <div className="glass-card rounded-2xl p-10 w-full max-w-sm border border-primary/15 shadow-2xl">
          <div className="text-center mb-8">
            <p className="text-primary/40 font-mono tracking-[0.4em] text-xs uppercase mb-2">天空</p>
            <h1 className="font-serif text-3xl font-bold text-white neon-text-sky mb-1">Admin Panel</h1>
            <p className="text-muted-foreground text-sm">Enter your admin password to continue</p>
          </div>
          <form onSubmit={handleLogin} className="space-y-5">
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type={showPw ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                autoFocus
                className="w-full pl-10 pr-10 py-3 bg-black/30 border border-white/10 rounded-lg text-white placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 font-mono text-sm"
              />
              <button
                type="button"
                onClick={() => setShowPw((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-white"
              >
                {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {loginError && <p className="text-rose-400 text-sm text-center">{loginError}</p>}
            <button
              type="submit"
              disabled={loginLoading || !password}
              className="w-full py-3 rounded-lg bg-primary/20 border border-primary/40 text-primary font-bold uppercase tracking-widest text-sm hover:bg-primary/30 transition-colors disabled:opacity-50"
            >
              {loginLoading ? "Checking…" : "Enter"}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return <AdminDashboard token={token} base={base} onLogout={clearToken} toast={toast} />;
}

function AdminDashboard({ token, base, onLogout, toast }: {
  token: string;
  base: string;
  onLogout: () => void;
  toast: ReturnType<typeof useToast>["toast"];
}) {
  const [data, setData] = useState<any>(null);
  const [bots, setBots] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionPending, setActionPending] = useState(false);
  const [activeTab, setActiveTab] = useState<"overview" | "bots">("overview");
  const [newBotName, setNewBotName] = useState("");
  const [newBotPhone, setNewBotPhone] = useState("");

  const authHeader = { Authorization: `Bearer ${token}` };

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [statsRes, botsRes] = await Promise.all([
        fetch(`${base}/api/v1/admin/stats`, { headers: authHeader }),
        fetch(`${base}/api/v1/admin/bots`, { headers: authHeader }),
      ]);
      if (statsRes.status === 401 || statsRes.status === 403) {
        onLogout();
        return;
      }
      setData(await statsRes.json());
      const botsJ = await botsRes.json();
      if (botsJ.success) setBots(botsJ.bots || []);
    } catch {
      setError("Could not reach admin API.");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const ownerAction = async (path: string, body: any, confirmMsg: string) => {
    if (!confirm(confirmMsg)) return;
    setActionPending(true);
    try {
      const r = await fetch(`${base}/api/v1/admin/${path}`, {
        method: "POST",
        headers: { ...authHeader, "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const j = await r.json();
      toast({ title: j.success ? "Done" : "Error", description: j.message });
      if (j.success) fetchData();
    } finally {
      setActionPending(false);
    }
  };

  const addBot = async () => {
    if (!newBotName.trim()) return;
    try {
      const r = await fetch(`${base}/api/v1/admin/bots`, {
        method: "POST",
        headers: { ...authHeader, "Content-Type": "application/json" },
        body: JSON.stringify({ name: newBotName, phone: newBotPhone }),
      });
      const j = await r.json();
      toast({ title: j.success ? "Bot added" : "Error", description: j.message });
      if (j.success) { setNewBotName(""); setNewBotPhone(""); fetchData(); }
    } catch {
      toast({ title: "Error", description: "Failed to add bot." });
    }
  };

  const removeBot = async (id: string, name: string) => {
    if (!confirm(`Remove bot "${name}"? This cannot be undone.`)) return;
    try {
      const r = await fetch(`${base}/api/v1/admin/bots/${id}`, {
        method: "DELETE",
        headers: authHeader,
      });
      const j = await r.json();
      toast({ title: j.success ? "Removed" : "Error", description: j.message });
      if (j.success) fetchData();
    } catch {
      toast({ title: "Error", description: "Failed to remove bot." });
    }
  };

  const toggleBotRole = async (bot: any, role: string) => {
    const roles: string[] = JSON.parse(bot.roles || "[]");
    const next = roles.includes(role) ? roles.filter((r) => r !== role) : [...roles, role];
    try {
      const r = await fetch(`${base}/api/v1/admin/bots/${bot.id}/roles`, {
        method: "POST",
        headers: { ...authHeader, "Content-Type": "application/json" },
        body: JSON.stringify({ roles: next }),
      });
      const j = await r.json();
      toast({ title: j.success ? "Roles updated" : "Error", description: j.message });
      if (j.success) fetchData();
    } catch {
      toast({ title: "Error", description: "Failed to update roles." });
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
          <h2 className="font-serif text-xl text-white mb-2">Error</h2>
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
          <button onClick={onLogout} className="px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/25 text-rose-400 text-xs font-bold uppercase tracking-widest hover:bg-rose-500/20 transition-colors flex items-center gap-1.5">
            <Lock className="w-3 h-3" /> Logout
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-white/5 pb-0">
        {(["overview", "bots"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={cn(
              "px-5 py-2.5 text-sm font-bold uppercase tracking-widest border-b-2 -mb-px transition-colors",
              activeTab === tab
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-white"
            )}
          >
            {tab === "overview" ? "Overview" : "Bot Manager"}
          </button>
        ))}
      </div>

      {activeTab === "overview" && (
        <>
          {/* Stat tiles */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
            <StatTile icon={Users}      label="Members"  value={s?.totalUsers}  color="text-primary" />
            <StatTile icon={Bot}        label="Bots"     value={s?.totalBots}   color="text-teal-400" />
            <StatTile icon={CreditCard} label="Cards"    value={s?.totalCards}  color="text-sky-400" />
            <StatTile icon={Shield}     label="Guilds"   value={s?.totalGuilds} color="text-amber-400" />
            <StatTile icon={Crown}      label="Staff"    value={s?.totalStaff}  color="text-violet-400" />
            <StatTile icon={Ban}        label="Banned"   value={s?.totalBanned} color="text-rose-400" />
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
          <section className="glass-card rounded-xl p-6 border border-rose-500/25 bg-rose-500/5">
            <h2 className="font-serif text-xl font-bold text-rose-400 mb-2 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" /> Danger Zone
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
        </>
      )}

      {activeTab === "bots" && (
        <div className="space-y-6">
          <section className="glass-card rounded-xl p-6 border border-primary/15">
            <h2 className="font-serif text-xl font-bold text-white mb-4 flex items-center gap-2">
              <Plus className="w-5 h-5 text-primary" /> Register New Bot
            </h2>
            <div className="flex flex-col sm:flex-row gap-3">
              <input
                type="text"
                placeholder="Bot name (e.g. TENKU Main)"
                value={newBotName}
                onChange={(e) => setNewBotName(e.target.value)}
                className="flex-1 px-4 py-2.5 bg-black/30 border border-white/10 rounded-lg text-white placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 text-sm"
              />
              <input
                type="text"
                placeholder="Phone (optional)"
                value={newBotPhone}
                onChange={(e) => setNewBotPhone(e.target.value)}
                className="w-full sm:w-48 px-4 py-2.5 bg-black/30 border border-white/10 rounded-lg text-white placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 text-sm font-mono"
              />
              <button
                onClick={addBot}
                disabled={!newBotName.trim()}
                className="px-6 py-2.5 rounded-lg bg-primary/20 border border-primary/40 text-primary font-bold uppercase tracking-widest text-sm hover:bg-primary/30 transition-colors disabled:opacity-50 shrink-0"
              >
                Add Bot
              </button>
            </div>
          </section>

          <section>
            <h2 className="font-serif text-xl font-bold text-white mb-4 flex items-center gap-2 border-b border-primary/15 pb-3">
              <Bot className="w-5 h-5 text-teal-400" /> Registered Bots ({bots.length})
            </h2>
            {bots.length === 0 ? (
              <div className="py-12 text-center text-muted-foreground">No bots registered yet. Add one above.</div>
            ) : (
              <div className="space-y-3">
                {bots.map((bot) => {
                  const roles: string[] = (() => { try { return JSON.parse(bot.roles || "[]"); } catch { return []; } })();
                  const hasOtp = roles.includes("otp");
                  return (
                    <div key={bot.id} className="glass-card rounded-xl px-5 py-4 border border-white/5 hover:border-teal-400/20 transition-colors">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="text-base font-bold text-white">{bot.name}</p>
                            <span className={cn(
                              "text-[9px] uppercase tracking-widest px-1.5 py-0.5 rounded border font-bold",
                              bot.status === "connected"
                                ? "border-emerald-500/30 text-emerald-400 bg-emerald-500/10"
                                : "border-rose-500/30 text-rose-400 bg-rose-500/10"
                            )}>
                              {bot.status}
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground font-mono">{bot.phone || "No phone"} · ID: {bot.id}</p>
                          <div className="flex flex-wrap gap-1.5 mt-2">
                            <button
                              onClick={() => toggleBotRole(bot, "otp")}
                              className={cn(
                                "text-[10px] uppercase tracking-widest px-2 py-0.5 rounded border font-bold transition-colors",
                                hasOtp
                                  ? "border-sky-400/50 text-sky-400 bg-sky-400/10 hover:bg-sky-400/20"
                                  : "border-white/10 text-muted-foreground hover:border-sky-400/30 hover:text-sky-400"
                              )}
                            >
                              {hasOtp ? "✓ OTP" : "+ OTP"}
                            </button>
                          </div>
                        </div>
                        <button
                          onClick={() => removeBot(bot.id, bot.name)}
                          className="p-2 rounded-lg text-rose-400 hover:bg-rose-500/10 transition-colors shrink-0"
                          title="Remove bot"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        </div>
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
