import { useGetCommunityStats } from "@workspace/api-client-react/src/generated/api";
import { Button } from "@/components/ui/button";
import { Users, Crosshair, CreditCard, Shield, Activity } from "lucide-react";
import { Link } from "wouter";

export default function Home() {
  const { data: stats, isLoading } = useGetCommunityStats();

  return (
    <div className="min-h-[100dvh]">
      {/* Hero Section */}
      <section className="relative h-[80vh] min-h-[600px] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img 
            src="/images/hero-bg.png" 
            alt="Tenku Sky" 
            className="w-full h-full object-cover opacity-50"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/70 to-transparent" />
          <div className="absolute inset-0 bg-black/40" />
          {/* Star-field shimmer overlay */}
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_0%,rgba(14,165,233,0.12),transparent)]" />
        </div>

        <div className="relative z-10 text-center px-4 max-w-4xl mx-auto mt-16 md:mt-0">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass-card border-primary/30 text-primary text-xs font-bold uppercase tracking-[0.3em] mb-6">
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse shadow-[0_0_8px_rgba(14,165,233,0.8)]" />
            <span className="font-mono">天空 · Heavenly Sky</span>
          </div>
          
          <h1 className="font-serif text-5xl md:text-7xl font-bold mb-4 tracking-tight leading-tight">
            <span className="text-white/80 text-2xl md:text-3xl block mb-2 tracking-[0.5em] font-sans font-light">WELCOME TO</span>
            <span className="bg-gradient-to-r from-sky-300 via-primary to-cyan-300 bg-clip-text text-transparent neon-text-sky">
              天空 TENKU
            </span>
          </h1>
          
          <p className="text-lg md:text-xl text-sky-100/70 mb-10 max-w-2xl mx-auto leading-relaxed font-light">
            Rise beyond the firmament. Ascend through the infinite sky.
            Collect cards, form guilds, build your empire, and conquer the heavens.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
            <a 
              href="https://chat.whatsapp.com/LDnXqYWuvZMELxVaOpAAHI" 
              target="_blank" 
              rel="noopener noreferrer"
              className="w-full sm:w-auto"
            >
              <Button size="lg" className="w-full sm:w-auto bg-primary hover:bg-primary/90 text-white font-bold tracking-[0.2em] uppercase px-8 h-14 rounded-sm neon-border-sky relative overflow-hidden group">
                <span className="relative z-10">Join Tenku</span>
                <div className="absolute inset-0 h-full w-full bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]" />
              </Button>
            </a>
            
            <a href="#stats" className="w-full sm:w-auto">
              <Button size="lg" variant="outline" className="w-full sm:w-auto border-primary/40 text-white hover:bg-primary/10 hover:text-white font-bold tracking-[0.2em] uppercase px-8 h-14 rounded-sm glass-card">
                View Stats
              </Button>
            </a>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section id="stats" className="py-24 px-4 bg-background relative">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
        
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-primary/50 font-mono tracking-[0.4em] text-xs uppercase mb-2">天空</p>
            <h2 className="font-serif text-3xl md:text-4xl font-bold mb-4 neon-text-sky">Community Pulse</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">The heavens are ever-expanding. Witness the true scale of our ascension.</p>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[1,2,3,4].map(i => (
                <div key={i} className="h-32 glass-card rounded-lg animate-pulse bg-white/5" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <StatCard icon={Users} label="Operatives" value={stats?.totalUsers ?? 0} color="text-primary" />
              <StatCard icon={CreditCard} label="Cards Collected" value={stats?.totalCards ?? 0} color="text-primary" />
              <StatCard icon={Shield} label="Guilds Active" value={stats?.totalGuilds ?? 0} color="text-amber-400" />
              <StatCard icon={Activity} label="Messages Today" value={stats?.messagesLast24h ?? 0} color="text-cyan-400" />
            </div>
          )}
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 px-4 relative">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-primary/50 font-mono tracking-[0.4em] text-xs uppercase mb-2">What Awaits</p>
            <h2 className="font-serif text-3xl md:text-4xl font-bold neon-text-sky">The Tenku Experience</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {FEATURES.map((f) => (
              <div key={f.title} className="glass-card rounded-xl p-6 border-primary/10 hover:border-primary/30 transition-all group hover:-translate-y-1 duration-300">
                <div className="w-12 h-12 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center mb-4 group-hover:shadow-[0_0_16px_rgba(14,165,233,0.3)] transition-shadow">
                  <f.icon className="w-6 h-6 text-primary" />
                </div>
                <h3 className="font-serif text-lg font-bold text-white mb-2">{f.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Footer */}
      <section className="py-20 px-4 text-center relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_60%_at_50%_50%,rgba(14,165,233,0.08),transparent)]" />
        <div className="relative z-10 max-w-2xl mx-auto">
          <p className="font-mono text-primary/50 tracking-[0.5em] text-xs uppercase mb-4">天空</p>
          <h2 className="font-serif text-4xl md:text-5xl font-bold text-white neon-text-sky mb-6">The Sky Has No Limit</h2>
          <p className="text-muted-foreground mb-8">Join Tenku on WhatsApp and begin your ascension today.</p>
          <a href="https://chat.whatsapp.com/LDnXqYWuvZMELxVaOpAAHI" target="_blank" rel="noopener noreferrer">
            <Button size="lg" className="bg-primary hover:bg-primary/90 text-white font-bold tracking-[0.2em] uppercase px-10 h-14 neon-border-sky">
              Ascend Now
            </Button>
          </a>
        </div>
      </section>
    </div>
  );
}

const FEATURES = [
  { icon: CreditCard, title: "Card Codex", desc: "Collect rare character cards from the Tenku universe. Each card is tiered from common to legendary." },
  { icon: Shield, title: "Guilds", desc: "Form powerful guilds with allies. Pool resources, dominate the leaderboard, and claim the firmament." },
  { icon: Crosshair, title: "RPG System", desc: "Battle in dungeons, level up your character, unlock classes, and take on epic quests." },
  { icon: Activity, title: "Economy", desc: "Earn gold, bank your wealth, trade cards, and participate in the global lottery pool." },
  { icon: Users, title: "Community", desc: "A thriving WhatsApp-native community with anti-spam, moderation, and real-time leaderboards." },
  { icon: Shield, title: "Gacha", desc: "Pull from the premium gacha pool for exclusive cards. Only Tenku operatives may spin the heavens." },
];

function StatCard({ icon: Icon, label, value, color }: { icon: any; label: string; value: number; color: string }) {
  return (
    <div className="glass-card rounded-xl p-6 border-primary/10 hover:border-primary/25 transition-all group">
      <div className="flex items-start justify-between mb-4">
        <Icon className={`w-6 h-6 ${color}`} />
        <span className="text-[10px] font-mono text-primary/30 tracking-widest uppercase">天空</span>
      </div>
      <p className={`text-3xl font-mono font-bold ${color} mb-1 group-hover:neon-text-sky transition-all`}>
        {value.toLocaleString()}
      </p>
      <p className="text-xs text-muted-foreground uppercase tracking-widest">{label}</p>
    </div>
  );
}
