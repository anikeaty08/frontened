"use client";

import Link from "next/link";
import { useState } from "react";
import { Icon } from "./Icon";
import AquaReserveLogo from "./AquaReserveLogo";
import ThemeToggle from "./ThemeToggle";

const links = [
  { href: "/reserves", label: "Reserves" },
  { href: "/verify", label: "Verify" },
  { href: "/#privacy", label: "Privacy" },
];

export default function SiteHeader() {
  const [open, setOpen] = useState(false);
  return (
    <header className="sticky top-0 z-50 border-b aqua-divider bg-[color-mix(in_srgb,var(--bg)_88%,transparent)] backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-[92rem] items-center justify-between px-5 lg:px-8">
        <Link
          href="/"
          className="flex items-center gap-3"
          aria-label="AquaReserve home"
        >
          <AquaReserveLogo size={30} />
          <span className="text-[1.05rem] font-bold tracking-[-.035em]">
            AquaReserve
          </span>
        </Link>
        <nav
          className="hidden items-center gap-8 text-sm text-[var(--muted)] md:flex"
          aria-label="Primary navigation"
        >
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="transition-colors hover:text-[var(--text)]"
            >
              {link.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Link
            href="/app"
            className="aqua-button aqua-button-primary !hidden sm:!inline-flex"
          >
            Launch app <Icon icon="solar:arrow-right-up-linear" />
          </Link>
          <button
            className="aqua-button aqua-button-secondary !h-10 !min-h-10 !w-10 !p-0 md:!hidden"
            onClick={() => setOpen((value) => !value)}
            aria-expanded={open}
            aria-label="Toggle navigation"
          >
            <Icon
              icon={
                open
                  ? "solar:close-circle-linear"
                  : "solar:hamburger-menu-linear"
              }
              className="text-xl"
            />
          </button>
        </div>
      </div>
      {open && (
        <nav className="border-t aqua-divider bg-[var(--surface)] px-5 py-4 md:hidden">
          {links.map((link) => (
            <Link
              onClick={() => setOpen(false)}
              key={link.href}
              href={link.href}
              className="block border-b aqua-divider py-3 text-sm"
            >
              {link.label}
            </Link>
          ))}
          <Link
            href="/app"
            className="aqua-button aqua-button-primary mt-4 w-full"
          >
            Launch app
          </Link>
        </nav>
      )}
    </header>
  );
}
