"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

/* This chrome only renders on stray routes (e.g. the 404 page) — every
   real surface carries its own. Keep the links pointed at live doors. */
const LINKS = [
  { href: "/overview", label: "Overview" },
  { href: "/app", label: "App" },
  { href: "/news", label: "News" },
  { href: "/investors", label: "Investors" },
];

// The marketing site (landing + corporate pages) supplies its own chrome.
const MARKETING = new Set(["/", "/news", "/join", "/investors", "/privacy", "/whitepaper"]);

export default function Nav() {
  const pathname = usePathname();
  // The unified app (/app) carries its own sidebar chrome; the module
  // select screen (/overview) is a full-viewport lobby with its own top.
  if (
    MARKETING.has(pathname) ||
    pathname.startsWith("/app") ||
    pathname.startsWith("/engine/holder") ||
    pathname === "/overview"
  )
    return null;
  return (
    <header className="topbar">
      <Link href="/" className="brand">
        {/* eslint-disable-next-line @next/next/no-img-element -- static SVG brand asset */}
        <img className="brand-logo" src="/brand/geom-logo-light.svg" alt="GEOM" />
        <span className="brand-sub">Real assets from the far north</span>
      </Link>
      <nav className="nav" aria-label="Primary">
        {LINKS.map((l) => (
          <Link
            key={l.href}
            href={l.href}
            className={pathname === l.href ? "active" : undefined}
          >
            {l.label}
          </Link>
        ))}
      </nav>
    </header>
  );
}
