import { ArrowLeft, ArrowRight } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { DirectionalSlide } from "@/components/ui/directional-slide";
import { renderLesson } from "@/features/learn/render-lesson";
import { getLesson, LESSONS } from "@/lib/lessons";

type Params = PageProps<"/learn/[slug]">["params"];

// Every lesson slug is known at build time, so all of these pages are
// prerendered to static HTML. Unknown slugs fall through to notFound().
export function generateStaticParams() {
  return LESSONS.map((lesson) => ({ slug: lesson.slug }));
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug } = await params;
  const lesson = getLesson(slug);
  return lesson ? { title: lesson.title, description: lesson.blurb } : { title: "Lesson not found" };
}

export default function LessonPage({ params }: { params: Params }) {
  return (
    <DirectionalSlide name="lesson-page">
      <Suspense fallback={<LessonSkeleton />}>
        <LessonContent params={params} />
      </Suspense>
    </DirectionalSlide>
  );
}

async function LessonContent({ params }: { params: Params }) {
  const { slug } = await params;
  const index = LESSONS.findIndex((lesson) => lesson.slug === slug);
  const html = index === -1 ? null : await renderLesson(slug);
  if (!html) notFound();

  const previous = LESSONS[index - 1];
  const next = LESSONS[index + 1];

  return (
    <article>
      <p className="eyebrow">
        <Link href="/learn" className="underline-offset-4 hover:underline">
          The guide
        </Link>{" "}
        · Lesson {LESSONS[index].number}
      </p>

      {/* The HTML comes from Markdown files in this repository, written by
          the project's authors — never from users. Do not render
          user-supplied HTML this way without sanitizing it first. */}
      <div className="prose-lesson mt-3" dangerouslySetInnerHTML={{ __html: html }} />

      <nav aria-label="Lessons" className="mt-14 grid max-w-176 gap-3 border-t border-ink pt-5 sm:grid-cols-2">
        {previous ? (
          <Link
            href={`/learn/${previous.slug}`}
            transitionTypes={["nav-back"]}
            className="group rounded-[3px] border border-rule p-4 transition-colors hover:border-ink"
          >
            <span className="eyebrow flex items-center gap-1.5">
              <ArrowLeft className="size-3.5 transition-transform group-hover:-translate-x-1" aria-hidden="true" />
              Previous
            </span>
            <span className="mt-1 block font-display text-2xl">{previous.title}</span>
          </Link>
        ) : (
          <span />
        )}
        {next ? (
          <Link
            href={`/learn/${next.slug}`}
            transitionTypes={["nav-forward"]}
            className="group rounded-[3px] border border-rule p-4 text-right transition-colors hover:border-ink"
          >
            <span className="eyebrow flex items-center justify-end gap-1.5">
              Next
              <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-1" aria-hidden="true" />
            </span>
            <span className="mt-1 block font-display text-2xl">{next.title}</span>
          </Link>
        ) : null}
      </nav>
    </article>
  );
}

function LessonSkeleton() {
  return (
    <div aria-hidden="true" className="max-w-176 space-y-4">
      <div className="skeleton h-3 w-40" />
      <div className="skeleton h-14 w-3/4" />
      {[96, 88, 92, 70, 94, 85, 60].map((width, i) => (
        <div key={i} className="skeleton h-4" style={{ width: `${width}%` }} />
      ))}
    </div>
  );
}
