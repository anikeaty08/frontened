import Link from "next/link";
import { Icon } from "@/components/Icon";
import AppShell from "@/components/AppShell";
import Architecture from "@/components/Architecture";
import LatestSnapshot from "@/components/LatestSnapshot";

const proofPoints = [
  {
    icon: "solar:lock-keyhole-linear",
    title: "Private liabilities",
    body: "Customer balances are committed into a Merkle root. They are not written to the public ledger.",
  },
  {
    icon: "solar:chart-square-linear",
    title: "Scoped coverage",
    body: "Reserve and liability totals are compared in zero knowledge for one asset, cutoff and declared scope.",
  },
  {
    icon: "solar:history-linear",
    title: "Visible lifecycle",
    body: "Pending, verified, shortfall, expired and revoked states remain explicit and independently inspectable.",
  },
];

export default function Home() {
  return (
    <AppShell>
      <section className="aqua-glow relative overflow-hidden border-b aqua-divider">
        <div className="aqua-grid absolute inset-0 opacity-[.16] [mask-image:linear-gradient(to_bottom,black,transparent_86%)]" />
        <div className="relative mx-auto grid min-h-[calc(100svh-4rem)] max-w-[92rem] items-center gap-14 px-5 py-20 lg:grid-cols-12 lg:px-8">
          <div className="aqua-rise lg:col-span-7">
            <div className="inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-xs text-[var(--muted)]">
              <span className="h-2 w-2 rounded-full bg-[var(--success)] aqua-pulse" />
              Live reserve assurance on Midnight
            </div>
            <h1 className="mt-8 max-w-4xl text-[clamp(3.6rem,7vw,7.4rem)] font-bold leading-[.9] tracking-[-.065em]">
              Prove coverage.
              <br />
              <span className="text-[var(--accent)]">Preserve privacy.</span>
            </h1>
            <p className="mt-7 max-w-2xl text-base leading-7 text-[var(--muted)] sm:text-lg">
              AquaReserve gives custodial platforms a verifiable reserve
              snapshot and gives customers a private way to confirm
              inclusion—without publishing balances, identities or wallet
              structure.
            </p>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/reserves"
                className="aqua-button aqua-button-primary px-6"
              >
                View reserve snapshots <Icon icon="solar:arrow-right-linear" />
              </Link>
              <Link
                href="/verify"
                className="aqua-button aqua-button-secondary px-6"
              >
                Verify my inclusion
              </Link>
            </div>
            <div className="mt-12 flex flex-wrap gap-x-8 gap-y-4 text-xs text-[var(--muted)]">
              <span className="flex items-center gap-2">
                <Icon
                  icon="solar:check-circle-linear"
                  className="text-[var(--success)]"
                />
                Scoped and time-bound
              </span>
              <span className="flex items-center gap-2">
                <Icon
                  icon="solar:check-circle-linear"
                  className="text-[var(--success)]"
                />
                Independent attestation
              </span>
              <span className="flex items-center gap-2">
                <Icon
                  icon="solar:check-circle-linear"
                  className="text-[var(--success)]"
                />
                Customer-private receipts
              </span>
            </div>
          </div>
          <div className="aqua-rise-delay lg:col-span-5">
            <LatestSnapshot />
          </div>
        </div>
      </section>

      <section id="scope" className="bg-[var(--bg)] py-24 sm:py-32">
        <div className="mx-auto max-w-[92rem] px-5 lg:px-8">
          <div className="max-w-3xl">
            <p className="aqua-kicker">Reserve assurance</p>
            <h2 className="mt-5 text-4xl font-bold tracking-[-.045em] sm:text-5xl">
              One clear claim, backed by evidence.
            </h2>
            <p className="mt-6 max-w-2xl leading-7 text-[var(--muted)]">
              A verified status means the committed reserve total covered the
              committed liability total for the named asset, scope and cutoff.
              AquaReserve keeps that claim precise.
            </p>
          </div>
          <div className="mt-16 grid gap-0 border-y aqua-divider md:grid-cols-3">
            {proofPoints.map((item, index) => (
              <div
                key={item.title}
                className={`py-9 md:px-8 ${index > 0 ? "border-t md:border-l md:border-t-0 aqua-divider" : ""}`}
              >
                <Icon
                  icon={item.icon}
                  className="text-3xl text-[var(--accent)]"
                />
                <h3 className="mt-8 text-xl font-semibold">{item.title}</h3>
                <p className="mt-3 text-sm leading-6 text-[var(--muted)]">
                  {item.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Architecture />

      <section className="bg-[var(--bg)] py-24 sm:py-32">
        <div className="mx-auto grid max-w-[92rem] gap-12 px-5 lg:grid-cols-12 lg:px-8">
          <div className="lg:col-span-5">
            <p className="aqua-kicker">For customers</p>
            <h2 className="mt-5 text-4xl font-bold tracking-[-.045em]">
              Confirm your balance was included.
            </h2>
            <p className="mt-5 leading-7 text-[var(--muted)]">
              Use your private customer credential to retrieve only your
              receipt. AquaReserve verifies its Merkle path against the public
              membership root without revealing another account.
            </p>
            <Link
              href="/verify"
              className="aqua-button aqua-button-primary mt-8"
            >
              Start private verification{" "}
              <Icon icon="solar:arrow-right-linear" />
            </Link>
          </div>
          <div className="aqua-panel rounded-2xl p-7 lg:col-span-7">
            <div className="grid gap-6 sm:grid-cols-3">
              {[
                "Your receipt is decrypted",
                "The Merkle path is checked",
                "Current public status is shown",
              ].map((text, index) => (
                <div key={text}>
                  <span className="aqua-mono text-xs text-[var(--accent)]">
                    0{index + 1}
                  </span>
                  <p className="mt-4 font-semibold leading-6">{text}</p>
                </div>
              ))}
            </div>
            <div className="mt-8 rounded-xl border border-[var(--border)] bg-[var(--surface-soft)] p-5 text-sm text-[var(--muted)]">
              <Icon
                icon="solar:shield-keyhole-bold"
                className="mr-2 inline text-xl text-[var(--accent)]"
              />
              Private receipts are never returned by the public snapshot
              endpoints.
            </div>
          </div>
        </div>
      </section>

      <section className="border-t aqua-divider bg-[var(--surface)] py-20">
        <div className="mx-auto flex max-w-[92rem] flex-col items-start justify-between gap-8 px-5 md:flex-row md:items-center lg:px-8">
          <div>
            <p className="aqua-kicker">AquaReserve app</p>
            <h2 className="mt-4 text-3xl font-bold tracking-[-.04em]">
              Publish, attest or verify from one secure workspace.
            </h2>
          </div>
          <Link href="/app" className="aqua-button aqua-button-primary px-6">
            Launch app <Icon icon="solar:arrow-right-up-linear" />
          </Link>
        </div>
      </section>
    </AppShell>
  );
}
