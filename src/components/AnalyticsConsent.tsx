"use client";

import { useEffect, useState } from "react";
import Script from "next/script";
import Link from "next/link";

const STORAGE_KEY = "ofm-analytics-consent";
const DOMAIN = process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN;
const SRC = process.env.NEXT_PUBLIC_PLAUSIBLE_SRC ?? "https://plausible.io/js/script.js";

type Consent = "accepted" | "declined";

/**
 * Privacy-friendly, cookieless analytics with a consent gate.
 *
 * - Renders nothing at all unless NEXT_PUBLIC_PLAUSIBLE_DOMAIN is configured.
 * - Analytics only loads after the visitor explicitly accepts.
 * - The choice is stored in localStorage (not a tracking cookie).
 */
export default function AnalyticsConsent() {
  const [consent, setConsent] = useState<Consent | null>(null);
  const [decided, setDecided] = useState(true); // assume decided until hydrated

  useEffect(() => {
    if (!DOMAIN) return;
    try {
      const stored = localStorage.getItem(STORAGE_KEY) as Consent | null;
      if (stored === "accepted" || stored === "declined") {
        setConsent(stored);
        setDecided(true);
      } else {
        setDecided(false); // show the banner
      }
    } catch {
      setDecided(false);
    }
  }, []);

  const choose = (value: Consent) => {
    try {
      localStorage.setItem(STORAGE_KEY, value);
    } catch {
      /* ignore */
    }
    setConsent(value);
    setDecided(true);
  };

  if (!DOMAIN) return null;

  return (
    <>
      {consent === "accepted" ? (
        <Script defer data-domain={DOMAIN} src={SRC} strategy="afterInteractive" />
      ) : null}

      {!decided ? (
        <div
          role="dialog"
          aria-label="Privacy notice"
          className="fixed inset-x-3 bottom-3 z-[100] mx-auto max-w-2xl rounded-lg border border-border bg-card/95 p-4 shadow-lg backdrop-blur"
        >
          <p className="text-sm text-muted-foreground">
            We use privacy-friendly, <strong className="text-foreground">cookieless</strong>{" "}
            analytics to understand traffic — no personal data, no tracking cookies. See our{" "}
            <Link href="/privacy" className="text-emerald-400 underline-offset-4 hover:underline">
              privacy policy
            </Link>
            .
          </p>
          <div className="mt-3 flex gap-2">
            <button
              type="button"
              onClick={() => choose("accepted")}
              className="rounded-md bg-emerald-500 px-3.5 py-1.5 text-sm font-medium text-black transition-colors hover:bg-emerald-400"
            >
              Accept
            </button>
            <button
              type="button"
              onClick={() => choose("declined")}
              className="rounded-md border border-border px-3.5 py-1.5 text-sm text-foreground transition-colors hover:bg-secondary"
            >
              Decline
            </button>
          </div>
        </div>
      ) : null}
    </>
  );
}
