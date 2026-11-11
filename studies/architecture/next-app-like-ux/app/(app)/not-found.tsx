import Link from "next/link";

export default function NotFound() {
  return (
    <div className="max-w-xl py-10">
      <p className="eyebrow">404</p>
      <h1 className="mt-2 font-display text-6xl leading-none">Not on this record.</h1>
      <p className="mt-4 text-lg text-ink-soft">That track or playlist does not exist, or it has been removed.</p>
      <Link
        href="/library"
        className="mt-6 inline-flex h-11 items-center rounded-full bg-ink px-5 font-medium text-paper transition-colors hover:bg-signal"
      >
        Browse the library
      </Link>
    </div>
  );
}
