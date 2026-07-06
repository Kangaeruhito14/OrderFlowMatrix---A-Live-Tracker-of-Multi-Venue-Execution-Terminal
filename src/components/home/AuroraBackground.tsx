/**
 * Decorative animated background: soft floating gradient blobs over a subtle
 * grid, adapting to light/dark. Pure CSS — zero JS cost.
 */
export default function AuroraBackground() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="ofm-grid-bg absolute inset-0" />
      <div className="ofm-blob-a absolute -top-32 left-1/4 h-96 w-96 rounded-full bg-emerald-500/15 blur-3xl dark:bg-emerald-500/10" />
      <div className="ofm-blob-b absolute -top-16 right-1/5 h-80 w-80 rounded-full bg-cyan-500/10 blur-3xl dark:bg-cyan-400/10" />
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-emerald-500/40 to-transparent" />
    </div>
  );
}
