"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Menu, X } from "lucide-react";
import ThemeToggle from "@/components/ThemeToggle";

const NAV = [
  { href: "/terminal", label: "Terminal" },
  { href: "/markets", label: "Markets" },
  { href: "/alerts", label: "Pulse" },
  { href: "/learn", label: "Learn" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
];

export default function SiteHeader() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/70 backdrop-blur-xl">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-5">
        <Link href="/" className="flex items-center gap-2.5" onClick={() => setOpen(false)}>
          <Image
            src="/logo.png"
            alt="Order Flow Matrix logo"
            width={1078}
            height={736}
            priority
            className="h-7 w-auto"
          />
          <span className="font-mono text-sm font-semibold tracking-tight text-foreground">
            Order Flow Matrix
          </span>
        </Link>

        {/* desktop nav */}
        <nav className="hidden items-center gap-1 md:flex">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-md px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              {item.label}
            </Link>
          ))}
          <span className="mx-1.5 h-5 w-px bg-border" aria-hidden />
          <ThemeToggle />
          <Link
            href="/terminal"
            className="ml-2 rounded-md bg-emerald-500 px-3.5 py-1.5 text-sm font-medium text-black shadow-sm shadow-emerald-500/30 transition-colors hover:bg-emerald-400"
          >
            Launch Terminal
          </Link>
        </nav>

        {/* mobile controls */}
        <div className="flex items-center gap-2 md:hidden">
          <ThemeToggle />
          <button
            type="button"
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
            className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-border text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
          >
            {open ? <X className="h-4 w-4" aria-hidden /> : <Menu className="h-4 w-4" aria-hidden />}
          </button>
        </div>
      </div>

      {/* mobile menu */}
      {open ? (
        <nav className="border-t border-border bg-background/95 px-5 pb-4 pt-2 backdrop-blur-xl md:hidden">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setOpen(false)}
              className="block rounded-md px-2 py-2.5 text-sm text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
            >
              {item.label}
            </Link>
          ))}
          <Link
            href="/terminal"
            onClick={() => setOpen(false)}
            className="mt-2 block rounded-md bg-emerald-500 px-3.5 py-2.5 text-center text-sm font-medium text-black transition-colors hover:bg-emerald-400"
          >
            Launch Terminal
          </Link>
        </nav>
      ) : null}
    </header>
  );
}
