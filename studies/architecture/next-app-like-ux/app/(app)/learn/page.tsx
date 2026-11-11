import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/page-header";
import { LESSONS } from "@/lib/lessons";

export const metadata: Metadata = { title: "The guide" };

// No data, no params: this page is fully static and served as plain HTML.
export default function LearnIndexPage() {
  return (
    <div className="space-y-10">
      <PageHeader eyebrow="The guide" title={<>How this app <em>feels fast</em></>}>
        Thirteen short lessons and a checklist. Each one names a problem, shows the code in this repository that
        solves it, and gives you something to try in the running app. Start the music first — it keeps playing while
        you read.
      </PageHeader>

      <ol className="border-t border-ink">
        {LESSONS.map((lesson, index) => (
          <li key={lesson.slug} className="animate-rise" style={{ animationDelay: `${index * 35}ms` }}>
            <Link
              href={`/learn/${lesson.slug}`}
              className="group grid grid-cols-[3rem_minmax(0,1fr)] items-baseline gap-x-4 border-b border-rule py-5 transition-colors hover:bg-card sm:grid-cols-[4.5rem_minmax(0,22rem)_minmax(0,1fr)] sm:px-3"
            >
              <span className="font-mono text-sm text-signal">{lesson.number}</span>
              <span className="font-display text-3xl leading-tight decoration-signal decoration-2 underline-offset-4 group-hover:underline">
                {lesson.title}
              </span>
              <span className="col-start-2 mt-1 text-ink-soft sm:col-start-3 sm:mt-0">{lesson.blurb}</span>
            </Link>
          </li>
        ))}
      </ol>
    </div>
  );
}
