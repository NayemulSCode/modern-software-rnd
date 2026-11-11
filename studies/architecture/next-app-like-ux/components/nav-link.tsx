"use client";

import clsx from "clsx";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { type ReactNode, Suspense } from "react";

type NavLinkProps = {
  href: string;
  children: ReactNode;
  /** Match the path exactly. Without it, /learn also matches /learn/anything. */
  exact?: boolean;
  variant?: "sidebar" | "tab";
};

const base = {
  sidebar:
    "flex items-center gap-3 rounded-[3px] px-3 py-2 text-[0.9375rem] transition-colors hover:bg-paper-deep aria-[current=page]:bg-ink aria-[current=page]:text-paper",
  tab: "whitespace-nowrap rounded-full px-3 py-1.5 text-sm transition-colors hover:bg-paper-deep aria-[current=page]:bg-ink aria-[current=page]:text-paper",
};

function ActiveNavLink({ href, children, exact, variant = "sidebar" }: NavLinkProps) {
  const pathname = usePathname();
  const active = exact ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);

  return (
    <Link href={href} aria-current={active ? "page" : undefined} className={clsx(base[variant])}>
      {children}
    </Link>
  );
}

/**
 * `usePathname()` cannot be answered at build time for routes like
 * /track/[id], because the id is unknown until a request arrives. Under Cache
 * Components that means it suspends, so it needs a <Suspense> boundary. The
 * fallback is the same link without the active highlight, which keeps the
 * whole sidebar in the prerendered shell.
 */
export function NavLink(props: NavLinkProps) {
  return (
    <Suspense
      fallback={
        <Link href={props.href} className={base[props.variant ?? "sidebar"]}>
          {props.children}
        </Link>
      }
    >
      <ActiveNavLink {...props} />
    </Suspense>
  );
}
