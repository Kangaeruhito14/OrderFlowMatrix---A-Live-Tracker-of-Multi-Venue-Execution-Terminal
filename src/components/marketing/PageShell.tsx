/**
 * Consistent shell for content/legal pages (About, Privacy, Terms, Disclaimer).
 * Provides the container, title, optional lead, and an optional "last updated" line.
 */
export default function PageShell({
  title,
  lead,
  updated,
  children,
}: {
  title: string;
  lead?: string;
  updated?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mx-auto max-w-3xl px-5 py-16">
      <h1 className="text-3xl font-semibold tracking-tight text-foreground">{title}</h1>
      {lead ? <p className="mt-3 text-base text-muted-foreground">{lead}</p> : null}
      {updated ? (
        <p className="mt-2 font-mono text-xs text-muted-foreground">Last updated: {updated}</p>
      ) : null}
      <div className="mt-10 space-y-8 text-sm leading-relaxed text-muted-foreground">
        {children}
      </div>
    </div>
  );
}

/** Section heading used inside PageShell content. */
export function Section({
  heading,
  children,
}: {
  heading: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-3">
      <h2 className="text-lg font-semibold text-foreground">{heading}</h2>
      {children}
    </section>
  );
}
