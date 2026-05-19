import { Wind, Star, Compass, Eye, Zap } from "lucide-react";

export default function World() {
  const REGIONS = [
    { id: 1, name: "Tenku Capital",       desc: "The celestial throne city. Heart of the Tenku empire, floating above the clouds.", x: "50%", y: "38%", icon: Star,    color: "text-amber-400",  pulse: "bg-amber-400" },
    { id: 2, name: "Skyward Sanctuary",   desc: "Our celestial base of operations. Concealed beyond the firmament — only ascendants may enter.", x: "22%", y: "65%", icon: Wind,    color: "text-primary",   pulse: "bg-primary" },
    { id: 3, name: "The Void Rift",       desc: "A tear in the sky where the enemy gathers. Approach with extreme caution.", x: "78%", y: "22%", icon: Zap,     color: "text-rose-400",  pulse: "bg-rose-400" },
    { id: 4, name: "Natsuki's Observatory", desc: "High-altitude watch post used by the Founder. The entire world is visible from here.", x: "36%", y: "28%", icon: Eye,     color: "text-sky-300",   pulse: "bg-sky-300" },
    { id: 5, name: "Drifting Isles",      desc: "A wandering chain of islands. Home to rare card spawns and hidden treasures.", x: "68%", y: "75%", icon: Compass, color: "text-teal-400",  pulse: "bg-teal-400" },
  ];

  return (
    <div className="min-h-screen relative bg-[#030810] overflow-hidden flex flex-col">
      {/* Animated sky gradient background */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-b from-[#0a1628] via-[#04080f] to-[#030810]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_40%_at_50%_0%,rgba(14,165,233,0.15),transparent)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_40%_30%_at_20%_60%,rgba(14,165,233,0.08),transparent)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_30%_20%_at_80%_80%,rgba(56,189,248,0.06),transparent)]" />
        {/* Stars layer */}
        <svg className="absolute inset-0 w-full h-full opacity-30" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <radialGradient id="star" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="white" stopOpacity="1"/>
              <stop offset="100%" stopColor="white" stopOpacity="0"/>
            </radialGradient>
          </defs>
          {Array.from({ length: 80 }, (_, i) => (
            <circle
              key={i}
              cx={`${(i * 137.508) % 100}%`}
              cy={`${(i * 97.3) % 100}%`}
              r={i % 5 === 0 ? "1.5" : "0.8"}
              fill="url(#star)"
              opacity={0.3 + (i % 3) * 0.2}
            />
          ))}
        </svg>
        {/* World map image (faint) */}
        <img
          src="/images/world-map.png"
          alt="Tenku World"
          className="absolute inset-0 w-full h-full object-cover opacity-15 mix-blend-luminosity"
          onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
        />
      </div>

      {/* Header */}
      <div className="relative z-20 p-6 md:p-8 bg-gradient-to-b from-black/70 to-transparent pointer-events-none">
        <p className="text-primary/40 font-mono tracking-[0.5em] text-xs uppercase mb-1">天空</p>
        <h1 className="font-serif text-3xl md:text-5xl font-bold text-white neon-text-sky tracking-widest uppercase">Tenku World Map</h1>
        <p className="text-sky-200/50 mt-2 max-w-xl text-sm">
          The known territories of the Tenku realm. Hover over a region to reveal its nature.
        </p>
      </div>

      {/* Map + Markers */}
      <div className="flex-1 relative w-full h-full min-h-[700px]">
        {/* Grid lines for the "sky map" aesthetic */}
        <svg className="absolute inset-0 w-full h-full opacity-10 pointer-events-none z-10" xmlns="http://www.w3.org/2000/svg">
          {Array.from({ length: 10 }, (_, i) => (
            <line key={`h${i}`} x1="0" y1={`${(i + 1) * 10}%`} x2="100%" y2={`${(i + 1) * 10}%`} stroke="#0ea5e9" strokeWidth="0.5" />
          ))}
          {Array.from({ length: 10 }, (_, i) => (
            <line key={`v${i}`} x1={`${(i + 1) * 10}%`} y1="0" x2={`${(i + 1) * 10}%`} y2="100%" stroke="#0ea5e9" strokeWidth="0.5" />
          ))}
        </svg>

        {REGIONS.map((region) => (
          <div
            key={region.id}
            className="absolute -translate-x-1/2 -translate-y-1/2 group/marker cursor-crosshair z-20"
            style={{ left: region.x, top: region.y }}
          >
            <div className="relative">
              {/* Pulse ring */}
              <div className={`absolute inset-0 rounded-full animate-ping opacity-20 ${region.pulse}`} style={{ animationDuration: `${2 + region.id * 0.4}s` }} />
              <div className={`absolute inset-0 rounded-full animate-ping opacity-10 scale-150 ${region.pulse}`} style={{ animationDuration: `${3 + region.id * 0.4}s` }} />

              {/* Icon marker */}
              <div className={cn(
                "w-12 h-12 rounded-full glass-card border flex items-center justify-center relative z-10 transition-all duration-300 hover:scale-110 hover:shadow-lg",
                `border-${region.pulse.replace("bg-", "")}/30`,
                region.color
              )}>
                <region.icon className="w-5 h-5" />
              </div>

              {/* Tooltip */}
              <div className="absolute top-full left-1/2 -translate-x-1/2 mt-4 w-64 glass-panel border border-primary/15 p-4 rounded-xl opacity-0 translate-y-2 pointer-events-none group-hover/marker:opacity-100 group-hover/marker:translate-y-0 transition-all duration-300 z-50 shadow-[0_0_30px_rgba(14,165,233,0.2)]">
                <div className={cn("text-[10px] font-mono tracking-widest uppercase mb-1 opacity-60", region.color)}>
                  Region {String(region.id).padStart(2, "0")}
                </div>
                <h3 className="font-serif text-base font-bold text-white mb-2">{region.name}</h3>
                <p className="text-xs text-sky-200/60 leading-relaxed">{region.desc}</p>
                <div className="mt-3 pt-2 border-t border-white/5 text-[10px] font-bold text-primary tracking-[0.2em] uppercase text-center">
                  Tenku Territory
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="absolute bottom-24 md:bottom-8 right-4 md:right-8 z-20 glass-panel border border-primary/15 p-4 rounded-xl shadow-[0_0_20px_rgba(14,165,233,0.1)]">
        <h4 className="text-[10px] font-mono font-bold tracking-[0.3em] uppercase text-primary/60 mb-3 border-b border-white/5 pb-2">Map Legend</h4>
        <ul className="space-y-2 text-xs">
          <li className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full bg-amber-400 shadow-[0_0_6px_rgba(251,191,36,0.8)]" /> Capital</li>
          <li className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full bg-primary shadow-[0_0_6px_rgba(14,165,233,0.8)]" /> Friendly / HQ</li>
          <li className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full bg-rose-400 shadow-[0_0_6px_rgba(251,113,133,0.8)]" /> Hostile / Rift</li>
          <li className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full bg-sky-300" /> Observation</li>
          <li className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full bg-teal-400" /> Neutral / Loot</li>
        </ul>
      </div>
    </div>
  );
}

function cn(...classes: (string | undefined | false)[]) {
  return classes.filter(Boolean).join(" ");
}
