"use client";

import { useForm } from "react-hook-form";

type ContactFields = {
  name: string;
  email: string;
  message: string;
};

const CONTACT_EMAIL =
  process.env.NEXT_PUBLIC_CONTACT_EMAIL ?? "hello@your-domain.example";

const inputClass =
  "w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500";

export default function ContactForm() {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ContactFields>();

  // No backend yet: compose a pre-filled email in the visitor's mail client.
  // A hosted form with bot protection is planned (see TASKS.md, Phase 7).
  const onSubmit = (data: ContactFields) => {
    const subject = encodeURIComponent(`[Order Flow Matrix] Message from ${data.name}`);
    const body = encodeURIComponent(
      `${data.message}\n\n— ${data.name} (${data.email})`
    );
    window.location.href = `mailto:${CONTACT_EMAIL}?subject=${subject}&body=${body}`;
  };

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
          aria-invalid={errors.name ? "true" : "false"}
          {...register("name", { required: "Please enter your name" })}
        />
        {errors.name ? (
          <p className="mt-1 text-xs text-red-400">{errors.name.message}</p>
        ) : null}
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
          aria-invalid={errors.email ? "true" : "false"}
          {...register("email", {
            required: "Please enter your email",
            pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: "Enter a valid email" },
          })}
        />
        {errors.email ? (
          <p className="mt-1 text-xs text-red-400">{errors.email.message}</p>
        ) : null}
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
          aria-invalid={errors.message ? "true" : "false"}
          {...register("message", {
            required: "Please enter a message",
            minLength: { value: 10, message: "A little more detail, please (10+ characters)" },
          })}
        />
        {errors.message ? (
          <p className="mt-1 text-xs text-red-400">{errors.message.message}</p>
        ) : null}
      </div>

      <button
        type="submit"
        className="rounded-md bg-emerald-500 px-4 py-2 text-sm font-medium text-black transition-colors hover:bg-emerald-400"
      >
        Open email to send
      </button>
      <p className="text-xs text-muted-foreground">
        This opens your email app pre-filled. A hosted contact form is coming soon.
      </p>
    </form>
  );
}
