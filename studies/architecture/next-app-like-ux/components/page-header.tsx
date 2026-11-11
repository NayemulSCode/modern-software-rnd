import type { ReactNode } from "react";

export function PageHeader({ eyebrow, title, children }: { eyebrow: string; title: ReactNode; children?: ReactNode }) {
  return (
    <header className="animate-rise">
      <p className="eyebrow">{eyebrow}</p>
      <h1 className="mt-2 max-w-3xl text-balance font-display text-5xl leading-[0.98] tracking-tight sm:text-7xl">
        {title}
      </h1>
      {children ? <div className="mt-4 max-w-xl text-pretty text-lg text-ink-soft">{children}</div> : null}
    </header>
  );
}

export function SectionHeading({ title, note, id }: { title: string; note?: string; id?: string }) {
  return (
    <div className="mb-4 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
      <h2 id={id} className="font-display text-3xl">
        {title}
      </h2>
      {note ? <p className="eyebrow">{note}</p> : null}
    </div>
  );
}
