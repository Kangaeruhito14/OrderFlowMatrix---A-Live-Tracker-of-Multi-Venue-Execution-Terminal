/**
 * Animated infographic of the core architecture: five venues stream into the
 * adapter layer, get normalized into one model, and fan out to the terminal
 * panels. Traveling dots on the connectors are pure CSS.
 */

const VENUES = [
  { name: "Binance", color: "#f0b90b" },
  { name: "Bybit", color: "#f7a600" },
  { name: "OKX", color: "#8c8c8c" },
  { name: "Bitget", color: "#00f0ff" },
  { name: "KuCoin", color: "#23af91" },
];

const OUTPUTS = ["Trade Matrix", "Depth Ladder", "CVD", "Block Alerts"];

function FlowLine({ delay }: { delay: number }) {
  return (
    <div aria-hidden className="relative hidden h-px flex-1 bg-gradient-to-r from-border via-emerald-500/40 to-border md:block">
      <span className="ofm-flow-dot" style={{ animationDelay: `${delay}s` }} />
    </div>
  );
}

export default function PipelineInfographic() {
  return (
    <div className="flex flex-col items-stretch gap-6 md:flex-row md:items-center md:gap-4">
      {/* venues */}
      <div className="flex flex-row flex-wrap justify-center gap-2 md:flex-col md:justify-start">
        {VENUES.map((v) => (
          <span
            key={v.name}
            className="flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 font-mono text-xs text-foreground"
          >
            <span aria-hidden className="h-2 w-2 rounded-full" style={{ backgroundColor: v.color }} />
            {v.name}
          </span>
        ))}
      </div>

      <FlowLine delay={0} />

      {/* adapter core */}
      <div className="mx-auto flex max-w-xs flex-col items-center gap-2 rounded-xl border border-emerald-500/40 bg-card p-5 text-center shadow-lg shadow-emerald-500/10 md:mx-0">
        <span className="rounded-md bg-emerald-500/10 px-2.5 py-1 font-mono text-[11px] font-semibold uppercase tracking-wider text-emerald-500">
          Adapter Layer
        </span>
        <p className="text-sm text-muted-foreground">
          Five venue dialects normalized into one
        </p>
        <code className="rounded-md bg-secondary px-2 py-1 font-mono text-xs text-foreground">
          NormalizedTrade
        </code>
      </div>

      <FlowLine delay={1.3} />

      {/* outputs */}
      <div className="flex flex-row flex-wrap justify-center gap-2 md:flex-col md:justify-start">
        {OUTPUTS.map((o) => (
          <span
            key={o}
            className="rounded-lg border border-border bg-card px-3 py-2 font-mono text-xs text-foreground"
          >
            {o}
          </span>
        ))}
      </div>
    </div>
  );
}
