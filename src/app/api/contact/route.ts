import { NextRequest, NextResponse } from "next/server";

/**
 * Contact / waitlist intake.
 *
 *   POST /api/contact  { name?, email, message?, topic?, token? }
 *
 * - Validates input and rate-limits per IP.
 * - Verifies a Cloudflare Turnstile token when TURNSTILE_SECRET_KEY is set.
 * - Delivers to CONTACT_WEBHOOK_URL (Discord/Slack/Zapier/etc.) when set.
 * - When no webhook is configured, returns { ok:false, reason:"delivery_not_configured" }
 *   so the client can fall back to a mailto: link. Nothing is silently dropped.
 */

export const runtime = "nodejs";

const RATE_LIMIT = 5;
const RATE_WINDOW_MS = 60_000;
const hits = new Map<string, { count: number; resetAt: number }>();

function rateLimited(ip: string): boolean {
  const now = Date.now();
  const e = hits.get(ip);
  if (!e || now > e.resetAt) {
    hits.set(ip, { count: 1, resetAt: now + RATE_WINDOW_MS });
    return false;
  }
  e.count += 1;
  return e.count > RATE_LIMIT;
}

function clientIp(req: NextRequest): string {
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim();
  return req.headers.get("x-real-ip") ?? "unknown";
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

async function verifyTurnstile(token: string | undefined, ip: string): Promise<boolean> {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret) return true; // not configured → skip verification
  if (!token) return false;
  try {
    const body = new URLSearchParams({ secret, response: token });
    if (ip && ip !== "unknown") body.append("remoteip", ip);
    const res = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      body,
      signal: AbortSignal.timeout(8000),
    });
    const data = (await res.json()) as { success?: boolean };
    return data.success === true;
  } catch {
    return false;
  }
}

export async function POST(req: NextRequest) {
  const ip = clientIp(req);
  if (rateLimited(ip)) {
    return NextResponse.json({ ok: false, reason: "rate_limited" }, { status: 429 });
  }

  let payload: Record<string, unknown>;
  try {
    payload = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ ok: false, reason: "bad_request" }, { status: 400 });
  }

  const str = (v: unknown) => (typeof v === "string" ? v.trim() : "");
  const name = str(payload.name).slice(0, 100) || "Anonymous";
  const email = str(payload.email).slice(0, 200);
  const message = str(payload.message).slice(0, 5000);
  const topic = str(payload.topic) === "waitlist" ? "waitlist" : "contact";
  const token = typeof payload.token === "string" ? payload.token : undefined;

  if (!EMAIL_RE.test(email)) {
    return NextResponse.json({ ok: false, reason: "invalid_email" }, { status: 400 });
  }
  if (topic === "contact" && message.length < 5) {
    return NextResponse.json({ ok: false, reason: "message_too_short" }, { status: 400 });
  }

  if (!(await verifyTurnstile(token, ip))) {
    return NextResponse.json({ ok: false, reason: "turnstile_failed" }, { status: 403 });
  }

  const webhook = process.env.CONTACT_WEBHOOK_URL;
  if (!webhook) {
    // No delivery configured — let the client fall back to mailto.
    return NextResponse.json({ ok: false, reason: "delivery_not_configured" }, { status: 200 });
  }

  const summary =
    topic === "waitlist"
      ? `📥 Block-Trade Alerts waitlist signup: ${email}`
      : `✉️ New contact from ${name} <${email}>:\n${message}`;

  try {
    const res = await fetch(webhook, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      // `content` for Discord, `text` for Slack; extra fields for generic webhooks.
      body: JSON.stringify({ content: summary, text: summary, name, email, message, topic }),
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) {
      return NextResponse.json({ ok: false, reason: "delivery_failed" }, { status: 502 });
    }
  } catch {
    return NextResponse.json({ ok: false, reason: "delivery_failed" }, { status: 502 });
  }

  return NextResponse.json({ ok: true });
}
