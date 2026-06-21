/**
 * Renders a JSON-LD <script> for structured data (SEO + LLM discovery).
 * Server component — safe because the payload is our own serialized object.
 */
export default function JsonLd({
  data,
}: {
  data: Record<string, unknown> | Record<string, unknown>[];
}) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
