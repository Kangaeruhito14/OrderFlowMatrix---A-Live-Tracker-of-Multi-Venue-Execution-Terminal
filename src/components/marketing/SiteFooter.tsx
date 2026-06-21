import Link from "next/link";
import Disclaimer from "@/components/Disclaimer";

const COLUMNS = [
  {
    title: "Product",
    links: [
      { href: "/terminal", label: "Live Terminal" },
      { href: "/", label: "Home" },
    ],
  },
  {
    title: "Company",
    links: [
      { href: "/about", label: "About" },
      { href: "/contact", label: "Contact" },
    ],
  },
  {
    title: "Legal",
    links: [
      { href: "/privacy", label: "Privacy" },
      { href: "/terms", label: "Terms" },
      { href: "/disclaimer", label: "Disclaimer" },
    ],
  },
];

const VENUES = ["Binance", "Bybit", "OKX", "Bitget", "KuCoin"];

export default function SiteFooter() {
  return (
    <footer className="border-t border-border bg-background">
      <div className="mx-auto max-w-6xl px-5 py-12">
        <div className="grid gap-10 md:grid-cols-[1.5fr_repeat(3,1fr)]">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
              <span className="font-mono text-sm font-semibold text-foreground">
                Order Flow Matrix
              </span>
            </div>
            <p className="mt-3 max-w-xs text-sm text-muted-foreground">
              A live tracker of multi-venue crypto execution flow.
            </p>
            <div className="mt-4 flex flex-wrap gap-1.5">
              {VENUES.map((v) => (
                <span
                  key={v}
                  className="rounded border border-border px-2 py-0.5 font-mono text-[11px] text-muted-foreground"
                >
                  {v}
                </span>
              ))}
            </div>
          </div>

          {COLUMNS.map((col) => (
            <div key={col.title}>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-foreground">
                {col.title}
              </h3>
              <ul className="mt-3 space-y-2">
                {col.links.map((l) => (
                  <li key={l.href + l.label}>
                    <Link
                      href={l.href}
                      className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                    >
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-10 border-t border-border pt-6">
          <Disclaimer className="max-w-3xl text-xs leading-relaxed text-muted-foreground" />
          <p className="mt-4 text-xs text-muted-foreground">
            © {new Date().getFullYear()} Order Flow Matrix. Market data belongs to the
            respective exchanges. Not affiliated with Binance, Bybit, OKX, Bitget, or KuCoin.
          </p>
        </div>
      </div>
    </footer>
  );
}
