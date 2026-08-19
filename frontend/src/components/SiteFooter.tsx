import Link from "next/link";
import AquaReserveLogo from "./AquaReserveLogo";
import ServiceStatus from "./ServiceStatus";

export default function SiteFooter() {
  return (
    <footer className="border-t aqua-divider bg-[var(--surface)]">
      <div className="mx-auto grid max-w-[92rem] gap-12 px-5 py-14 md:grid-cols-12 lg:px-8">
        <div className="md:col-span-5">
          <Link href="/" className="flex items-center gap-3">
            <AquaReserveLogo size={30} />
            <span className="font-bold tracking-tight">AquaReserve</span>
          </Link>
          <p className="mt-5 max-w-sm text-sm leading-6 text-[var(--muted)]">
            Privacy-preserving reserve assurance for custodial digital-asset
            platforms. Public confidence without public customer data.
          </p>
          <div className="mt-6">
            <ServiceStatus />
          </div>
        </div>
        <div className="md:col-span-2 md:col-start-8">
          <p className="aqua-kicker mb-4">Product</p>
          <div className="space-y-3 text-sm text-[var(--muted)]">
            <Link className="block hover:text-[var(--text)]" href="/reserves">
              Reserve snapshots
            </Link>
            <Link className="block hover:text-[var(--text)]" href="/verify">
              Customer verification
            </Link>
            <Link className="block hover:text-[var(--text)]" href="/app">
              Operator access
            </Link>
          </div>
        </div>
        <div className="md:col-span-3">
          <p className="aqua-kicker mb-4">Assurance boundary</p>
          <div className="space-y-3 text-sm text-[var(--muted)]">
            <Link className="block hover:text-[var(--text)]" href="/#privacy">
              What stays private
            </Link>
            <Link className="block hover:text-[var(--text)]" href="/#scope">
              What a snapshot proves
            </Link>
            <a
              className="block hover:text-[var(--text)]"
              href="https://docs.midnight.network"
              target="_blank"
              rel="noreferrer"
            >
              Midnight documentation
            </a>
          </div>
        </div>
      </div>
      <div className="border-t aqua-divider">
        <div className="mx-auto flex max-w-[92rem] flex-col gap-2 px-5 py-6 text-xs text-[var(--faint)] sm:flex-row sm:justify-between lg:px-8">
          <span>© 2026 AquaReserve</span>
          <span>
            A verified snapshot is scoped, time-bound evidence—not a financial
            audit.
          </span>
        </div>
      </div>
    </footer>
  );
}
