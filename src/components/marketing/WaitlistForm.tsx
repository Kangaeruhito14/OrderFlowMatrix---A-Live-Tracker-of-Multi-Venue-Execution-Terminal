"use client";

import { useCallback, useState } from "react";
import TurnstileWidget, { TURNSTILE_ENABLED } from "@/components/marketing/TurnstileWidget";

const CONTACT_EMAIL =
  process.env.NEXT_PUBLIC_CONTACT_EMAIL ?? "hello@your-domain.example";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function WaitlistForm() {
  const [email, setEmail] = useState("");
  const [token, setToken] = useState("");
  const [status, setStatus] = useState<"idle" | "sent" | "mailto" | "error">("idle");
  const [error, setError] = useState("");

  const onTurnstile = useCallback((t: string) => setToken(t), []);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!EMAIL_RE.test(email)) {
      setError("Enter a valid email.");
      return;
    }
    if (TURNSTILE_ENABLED && !token) {
      setError("Please complete the bot check.");
      return;
    }
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, token, topic: "waitlist" }),
      });
      const body = (await res.json().catch(() => ({}))) as { ok?: boolean; reason?: string };
      if (res.ok && body.ok) {
        setStatus("sent");
        return;
      }
      if (body.reason === "delivery_not_configured") {
        window.location.href = `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(
          "Block-Trade Alerts waitlist"
        )}&body=${encodeURIComponent(`Please add me to the waitlist: ${email}`)}`;
        setStatus("mailto");
        return;
      }
      setError(body.reason === "rate_limited" ? "Too many attempts — try again shortly." : "Couldn't sign you up right now.");
      setStatus("error");
    } catch {
      window.location.href = `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(
        "Block-Trade Alerts waitlist"
      )}&body=${encodeURIComponent(`Please add me to the waitlist: ${email}`)}`;
      setStatus("mailto");
    }
  };

  if (status === "sent") {
    return (
      <p className="rounded-md border border-emerald-500/40 bg-emerald-500/10 p-4 text-sm text-foreground">
        You&apos;re on the list — we&apos;ll email you when alerts launch.
      </p>
    );
  }
  if (status === "mailto") {
    return (
      <p className="rounded-md border border-border bg-card p-4 text-sm text-muted-foreground">
        Your email app should have opened to confirm. If not, email{" "}
        <a href={`mailto:${CONTACT_EMAIL}`} className="text-emerald-400 underline-offset-4 hover:underline">
          {CONTACT_EMAIL}
        </a>
        .
      </p>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3" noValidate>
      <div className="flex flex-col gap-2 sm:flex-row">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          aria-label="Email address"
          className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
        />
        <button
          type="submit"
          className="shrink-0 rounded-md bg-emerald-500 px-4 py-2 text-sm font-medium text-black transition-colors hover:bg-emerald-400"
        >
          Join the waitlist
        </button>
      </div>
      <TurnstileWidget onToken={onTurnstile} />
      {error ? <p className="text-xs text-red-400">{error}</p> : null}
    </form>
  );
}
