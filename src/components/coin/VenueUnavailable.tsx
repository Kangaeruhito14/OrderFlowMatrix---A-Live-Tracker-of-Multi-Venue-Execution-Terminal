import { WifiOff, ExternalLink } from "lucide-react";
import type { ExchangeId } from "@/components/order-flow/adapters";
import { VENUES } from "@/lib/venues";

/**
 * Professional notice when a venue's public feed can't be reached from the
 * visitor's network/region — pointing them to the venue's own market page.
 */
export default function VenueUnavailable({
  exchange,
  base,
  quote,
}: {
  exchange: ExchangeId;
  base: string;
  quote: string;
}) {
  const v = VENUES[exchange];
  return (
    <div className="flex flex-col items-start gap-3 rounded-2xl border border-amber-500/30 bg-amber-500/5 p-5 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-start gap-3">
        <span className="mt-0.5 rounded-lg bg-amber-500/10 p-2 text-amber-500">
          <WifiOff className="h-4 w-4" aria-hidden />
        </span>
        <div>
          <p className="text-sm font-semibold text-foreground">
            Live {base}/{quote} data from {v.label} is currently unavailable
          </p>
          <p className="mt-1 max-w-xl text-sm text-muted-foreground">
            Our network can&apos;t retrieve {base}/{quote} data from {v.label} right now —
            some venues restrict access by region. Try another venue above, or view this
            market directly on {v.label}&apos;s official site for the latest data.
          </p>
        </div>
      </div>
      <a
        href={v.tradeUrl(base, quote)}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-border bg-card px-3.5 py-2 text-sm text-foreground transition-colors hover:border-emerald-500/40"
      >
        {base}/{quote} on {v.label}
        <ExternalLink className="h-3.5 w-3.5" aria-hidden />
      </a>
    </div>
  );
}
