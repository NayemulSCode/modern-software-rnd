/**
 * A transformer drawn as a shared bus: every block reads from the residual
 * stream and adds its output back into it. Static SVG, rendered on the
 * server; the text alternative carries the same content.
 */
export function ResidualStreamDiagram() {
  const blocks = [
    { x: 150, label: "Attention", sub: "layer 1" },
    { x: 290, label: "MLP", sub: "layer 1" },
    { x: 430, label: "Attention", sub: "layer 2" },
    { x: 570, label: "MLP", sub: "layer 2" },
  ]

  return (
    <figure className="not-prose my-10">
      <svg
        viewBox="0 0 760 250"
        role="img"
        aria-labelledby="rs-title rs-desc"
        className="h-auto w-full"
      >
        <title id="rs-title">A transformer as a residual stream</title>
        <desc id="rs-desc">
          Tokens are embedded into a vector, the residual stream, which flows
          left to right. Each attention layer and MLP layer reads from the
          stream and adds its result back. At the end, the unembedding turns
          the stream into a prediction for the next token.
        </desc>
        <defs>
          <marker id="rs-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
            <path d="M0,0 L10,5 L0,10 z" fill="var(--muted)" />
          </marker>
        </defs>

        {/* the stream */}
        <line x1={70} y1={170} x2={690} y2={170} stroke="var(--accent)" strokeWidth={10} strokeLinecap="round" opacity={0.85} />
        <text x={380} y={208} textAnchor="middle" fontSize={14} fill="var(--muted)">
          residual stream: one vector per token, shared by every layer
        </text>

        {/* input and output */}
        <rect x={6} y={150} width={60} height={40} rx={6} fill="var(--surface)" stroke="var(--border)" />
        <text x={36} y={175} textAnchor="middle" fontSize={13} fill="var(--foreground)">tokens</text>
        <rect x={694} y={150} width={60} height={40} rx={6} fill="var(--surface)" stroke="var(--border)" />
        <text x={724} y={168} textAnchor="middle" fontSize={12} fill="var(--foreground)">next</text>
        <text x={724} y={183} textAnchor="middle" fontSize={12} fill="var(--foreground)">token</text>

        {blocks.map((block) => (
          <g key={`${block.label}-${block.sub}`}>
            <path d={`M${block.x - 25},164 C${block.x - 25},120 ${block.x - 25},110 ${block.x - 25},92`} fill="none" stroke="var(--muted)" strokeWidth={1.5} markerEnd="url(#rs-arrow)" />
            <path d={`M${block.x + 25},92 C${block.x + 25},110 ${block.x + 25},120 ${block.x + 25},162`} fill="none" stroke="var(--muted)" strokeWidth={1.5} markerEnd="url(#rs-arrow)" />
            <rect x={block.x - 55} y={36} width={110} height={54} rx={8} fill="var(--background)" stroke="var(--border)" strokeWidth={1.5} />
            <text x={block.x} y={60} textAnchor="middle" fontSize={15} fontWeight={600} fill="var(--foreground)">
              {block.label}
            </text>
            <text x={block.x} y={78} textAnchor="middle" fontSize={12} fill="var(--muted)">
              {block.sub}
            </text>
            <text x={block.x - 34} y={128} textAnchor="middle" fontSize={11} fill="var(--muted)">read</text>
            <text x={block.x + 36} y={128} textAnchor="middle" fontSize={11} fill="var(--muted)">add</text>
          </g>
        ))}
      </svg>
      <figcaption className="mt-2 text-center text-sm text-muted">
        Each block reads the stream and adds its output back. Interpretability asks
        what is written into that stream, and by which block.
      </figcaption>
    </figure>
  )
}
