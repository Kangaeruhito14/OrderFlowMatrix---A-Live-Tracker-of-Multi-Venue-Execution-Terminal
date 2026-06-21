"use client";

import { useCallback, useState } from "react";
import { useForm } from "react-hook-form";
import TurnstileWidget, { TURNSTILE_ENABLED } from "@/components/marketing/TurnstileWidget";

type ContactFields = {
  name: string;
  email: string;
  message: string;
};

const CONTACT_EMAIL =
  process.env.NEXT_PUBLIC_CONTACT_EMAIL ?? "hello@your-domain.example";

const inputClass =
  "w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500";

const REASON_MESSAGES: Record<string, string> = {
  rate_limited: "Too many attempts — please wait a minute and try again.",
  invalid_email: "That email doesn't look valid.",
  message_too_short: "Please add a little more detail.",
  turnstile_failed: "Bot check failed — please retry the challenge.",
  delivery_failed: "Something went wrong sending your message. Please try again.",
};

function mailtoFallback(data: ContactFields) {
  const subject = encodeURIComponent(`[Order Flow Matrix] Message from ${data.name}`);
  const body = encodeURIComponent(`${data.message}\n\n— ${data.name} (${data.email})`);
  window.location.href = `mailto:${CONTACT_EMAIL}?subject=${subject}&body=${body}`;
}

export default function ContactForm() {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ContactFields>();

  const [token, setToken] = useState("");
  const [status, setStatus] = useState<"idle" | "sent" | "mailto" | "error">("idle");
  const [error, setError] = useState("");

  const onTurnstile = useCallback((t: string) => setToken(t), []);

  const onSubmit = async (data: ContactFields) => {
    setError("");
    if (TURNSTILE_ENABLED && !token) {
      setError("Please complete the bot check.");
      return;
    }
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, token, topic: "contact" }),
      });
      const body = (await res.json().catch(() => ({}))) as { ok?: boolean; reason?: string };

      if (res.ok && body.ok) {
        setStatus("sent");
        return;
      }
      if (body.reason === "delivery_not_configured") {
        // Hosted delivery isn't set up yet — fall back to the visitor's mail client.
        mailtoFallback(data);
        setStatus("mailto");
        return;
      }
      setError(REASON_MESSAGES[body.reason ?? ""] ?? "Couldn't send right now.");
      setStatus("error");
    } catch {
      // Network error — fall back to mailto so the message isn't lost.
      mailtoFallback(data);
      setStatus("mailto");
    }
  };

  if (status === "sent") {
    return (
      <p className="rounded-md border border-emerald-500/40 bg-emerald-500/10 p-4 text-sm text-foreground">
        Thanks — your message was sent. We&apos;ll get back to you.
      </p>
    );
  }
  if (status === "mailto") {
    return (
      <p className="rounded-md border border-border bg-card p-4 text-sm text-muted-foreground">
        Your email app should have opened with the message ready to send. If it didn&apos;t,
        email us at{" "}
        <a href={`mailto:${CONTACT_EMAIL}`} className="text-emerald-400 underline-offset-4 hover:underline">
          {CONTACT_EMAIL}
        </a>
        .
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
      <div>
        <label htmlFor="name" className="mb-1.5 block text-xs font-medium text-foreground">
          Name
        </label>
        <input
          id="name"
          type="text"
          className={inputClass}
          placeholder="Your name"
          {...register("name", { required: "Please enter your name" })}
        />
        {errors.name ? <p className="mt-1 text-xs text-red-400">{errors.name.message}</p> : null}
      </div>

      <div>
        <label htmlFor="email" className="mb-1.5 block text-xs font-medium text-foreground">
          Email
        </label>
        <input
          id="email"
          type="email"
          className={inputClass}
          placeholder="you@example.com"
          {...register("email", {
            required: "Please enter your email",
            pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: "Enter a valid email" },
          })}
        />
        {errors.email ? <p className="mt-1 text-xs text-red-400">{errors.email.message}</p> : null}
      </div>

      <div>
        <label htmlFor="message" className="mb-1.5 block text-xs font-medium text-foreground">
          Message
        </label>
        <textarea
          id="message"
          rows={5}
          className={inputClass}
          placeholder="What's on your mind?"
          {...register("message", {
            required: "Please enter a message",
            minLength: { value: 10, message: "A little more detail, please (10+ characters)" },
          })}
        />
        {errors.message ? <p className="mt-1 text-xs text-red-400">{errors.message.message}</p> : null}
      </div>

      <TurnstileWidget onToken={onTurnstile} />

      {error ? <p className="text-xs text-red-400">{error}</p> : null}

      <button
        type="submit"
        disabled={isSubmitting}
        className="rounded-md bg-emerald-500 px-4 py-2 text-sm font-medium text-black transition-colors hover:bg-emerald-400 disabled:opacity-60"
      >
        {isSubmitting ? "Sending…" : "Send message"}
      </button>
    </form>
  );
}
