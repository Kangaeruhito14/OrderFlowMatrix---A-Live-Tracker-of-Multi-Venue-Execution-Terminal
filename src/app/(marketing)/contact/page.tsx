import type { Metadata } from "next";
import ContactForm from "@/components/marketing/ContactForm";
import PageShell, { Section } from "@/components/marketing/PageShell";

export const metadata: Metadata = {
  title: "Contact",
  description:
    "Get in touch with the Order Flow Matrix team — feedback, questions, bug reports and feature requests.",
  alternates: { canonical: "/contact" },
};

export default function ContactPage() {
  return (
    <PageShell
      title="Contact"
      lead="Feedback, bug reports, feature requests, or just questions — we'd like to hear them."
    >
      <Section heading="Send a message">
        <ContactForm />
      </Section>

      <Section heading="What to expect">
        <p>
          This is an independent project, so replies are best-effort rather than
          guaranteed. For bug reports, please include the exchange and symbol you were
          viewing and what you saw — it makes issues far easier to reproduce.
        </p>
      </Section>
    </PageShell>
  );
}
