import { COINS } from "@/lib/coins";

/** Horizontal coin switcher (curated majors, USDT-quoted). */
export default function CoinPicker({
  base,
  onSelect,
}: {
  base: string;
  onSelect: (base: string) => void;
}) {
  return (
    <div className="flex gap-1.5 overflow-x-auto pb-1" role="tablist" aria-label="Select market">
      {COINS.map((c) => {
        const active = c.base === base;
        return (
          <button
            key={c.base}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onSelect(c.base)}
            className={`flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 font-mono text-xs transition-colors ${
              active
                ? "border-emerald-500/60 bg-emerald-500/10 text-foreground"
                : "border-border bg-card text-muted-foreground hover:border-emerald-500/30 hover:text-foreground"
            }`}
          >
            <span
              aria-hidden
              className="flex h-4 w-4 items-center justify-center rounded-full text-[7px] font-bold text-white"
              style={{ backgroundColor: c.color }}
            >
              {c.base.slice(0, 1)}
            </span>
            {c.base}
          </button>
        );
      })}
    </div>
  );
}
