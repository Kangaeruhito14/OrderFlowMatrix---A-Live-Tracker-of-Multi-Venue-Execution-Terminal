"use client";

import { useSyncExternalStore } from "react";
import Script from "next/script";
import Link from "next/link";

const STORAGE_KEY = "ofm-analytics-consent";
const DOMAIN = process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN;
const SRC = process.env.NEXT_PUBLIC_PLAUSIBLE_SRC ?? "https://plausible.io/js/script.js";

/**
 * Tiny external store around localStorage so React reads consent via
 * useSyncExternalStore — hydration-safe (server snapshot renders nothing)
 * and free of setState-in-effect patterns.
 */
let listeners: Array<() => void> = [];

function subscribe(listener: () => void) {
  listeners.push(listener);
  return () => {
    listeners = listeners.filter((l) => l !== listener);
  };
}

function readConsent(): string {
  try {
    return localStorage.getItem(STORAGE_KEY) ?? "unset";
  } catch {
    return "unset";
  }
}

function writeConsent(value: "accepted" | "declined") {
  try {
    localStorage.setItem(STORAGE_KEY, value);
  } catch {
    /* ignore */
  }
  for (const l of listeners) l();
}

/**
 * Privacy-friendly, cookieless analytics with a consent gate.
 *
 * - Renders nothing at all unless NEXT_PUBLIC_PLAUSIBLE_DOMAIN is configured.
 * - Analytics only loads after the visitor explicitly accepts.
 * - The choice is stored in localStorage (not a tracking cookie).
 */
export default function AnalyticsConsent() {
  // "ssr" on the server → nothing rendered until the client takes over.
  const consent = useSyncExternalStore(subscribe, readConsent, () => "ssr");

  if (!DOMAIN || consent === "ssr") return null;

  return (
    <>
      {consent === "accepted" ? (
        <Script defer data-domain={DOMAIN} src={SRC} strategy="afterInteractive" />
      ) : null}

      {consent === "unset" ? (
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
              onClick={() => writeConsent("accepted")}
              className="rounded-md bg-emerald-500 px-3.5 py-1.5 text-sm font-medium text-black transition-colors hover:bg-emerald-400"
            >
              Accept
            </button>
            <button
              type="button"
              onClick={() => writeConsent("declined")}
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
