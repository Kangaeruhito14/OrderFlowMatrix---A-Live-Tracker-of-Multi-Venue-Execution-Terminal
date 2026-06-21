import Link from "next/link";

const NAV = [
  { href: "/terminal", label: "Terminal" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
];

export default function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-5">
        <Link href="/" className="flex items-center gap-2.5">
          <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 shadow-[0_0_12px] shadow-emerald-500/70" />
          <span className="font-mono text-sm font-semibold tracking-tight text-foreground">
            Order Flow Matrix
          </span>
        </Link>

        <nav className="flex items-center gap-1">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-md px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              {item.label}
            </Link>
          ))}
          <Link
            href="/terminal"
            className="ml-2 rounded-md bg-emerald-500 px-3.5 py-1.5 text-sm font-medium text-black transition-colors hover:bg-emerald-400"
          >
            Launch Terminal
          </Link>
        </nav>
      </div>
    </header>
  );
}
