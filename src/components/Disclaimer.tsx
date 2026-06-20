/**
 * "Not financial advice" disclaimer.
 *
 * Reused across the marketing footer, the legal/disclaimer page, and the terminal.
 * Keep the wording honest: this app shows public market data, nothing more.
 */
export default function Disclaimer({ className }: { className?: string }) {
  return (
    <p className={className}>
      <strong>Not financial advice.</strong> Order Flow Matrix visualizes publicly
      available exchange market data for informational and educational purposes only. It
      is not investment, trading, or financial advice, and makes no guarantee of the
      accuracy, completeness, or timeliness of any data shown. Markets are risky; you are
      solely responsible for your own decisions.
    </p>
  );
}
