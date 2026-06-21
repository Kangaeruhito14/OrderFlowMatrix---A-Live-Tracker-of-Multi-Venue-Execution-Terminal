"use client";

import { useEffect, useRef, useState } from "react";
import Script from "next/script";

const SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

/** True when Turnstile is configured — forms use this to require a token. */
export const TURNSTILE_ENABLED = !!SITE_KEY;

interface TurnstileApi {
  render: (
    el: HTMLElement,
    opts: {
      sitekey: string;
      theme?: "light" | "dark" | "auto";
      callback?: (token: string) => void;
      "error-callback"?: () => void;
      "expired-callback"?: () => void;
    }
  ) => string;
  reset: (id?: string) => void;
}

declare global {
  interface Window {
    turnstile?: TurnstileApi;
  }
}

/** Cloudflare Turnstile widget. Renders nothing unless a site key is configured. */
export default function TurnstileWidget({ onToken }: { onToken: (token: string) => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const widgetId = useRef<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!SITE_KEY || !ready || !ref.current || widgetId.current) return;
    if (!window.turnstile) return;
    widgetId.current = window.turnstile.render(ref.current, {
      sitekey: SITE_KEY,
      theme: "dark",
      callback: (t) => onToken(t),
      "error-callback": () => onToken(""),
      "expired-callback": () => onToken(""),
    });
  }, [ready, onToken]);

  if (!SITE_KEY) return null;

  return (
    <>
      <Script
        src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit"
        strategy="afterInteractive"
        onLoad={() => setReady(true)}
      />
      <div ref={ref} className="min-h-[65px]" />
    </>
  );
}
