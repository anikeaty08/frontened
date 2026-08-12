import { Icon } from "./Icon";

const boundaries = [
  {
    icon: "solar:database-linear",
    title: "Private source boundary",
    body: "Customer liabilities, reserve totals, evidence references, salts and proof witnesses stay inside the issuer and prover boundary.",
  },
  {
    icon: "solar:shield-keyhole-linear",
    title: "Authorized evidence boundary",
    body: "Issuer, attester and customer access remains role-scoped. Each customer receives only their own encrypted inclusion receipt.",
  },
  {
    icon: "solar:global-linear",
    title: "Public assurance boundary",
    body: "The public sees commitments, declared scope, signatures, freshness and the verified lifecycle status - never raw balances or identities.",
  },
];

export default function Architecture() {
  return (
    <section
      id="privacy"
      className="border-y aqua-divider bg-[var(--surface)] py-24 sm:py-32"
    >
      <div className="mx-auto grid max-w-[92rem] items-center gap-16 px-5 lg:grid-cols-2 lg:px-8">
        <div
          className="relative mx-auto flex aspect-square w-full max-w-[34rem] items-center justify-center"
          aria-label="Three concentric privacy boundaries around an AquaReserve proof"
        >
          <div className="absolute inset-0 rounded-full border border-[var(--border)]" />
          <div className="absolute inset-[12%] rounded-full border border-dashed border-[var(--border-strong)]" />
          <div className="absolute inset-[25%] rounded-full border border-[var(--border)] bg-[var(--surface-soft)]" />
          <div className="absolute left-1/2 top-0 flex -translate-x-1/2 -translate-y-1/2 items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-[.65rem] font-semibold text-[var(--muted)] shadow-sm">
            <span className="h-2 w-2 rounded-full bg-[var(--accent)]" />
            PUBLIC
          </div>
          <div className="absolute bottom-[8%] right-[5%] rounded-full border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-[.65rem] font-semibold text-[var(--muted)] shadow-sm">
            AUTHORIZED
          </div>
          <div className="absolute left-[4%] top-[23%] rounded-full border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-[.65rem] font-semibold text-[var(--muted)] shadow-sm">
            PRIVATE
          </div>
          <div className="relative z-10 flex h-28 w-28 flex-col items-center justify-center rounded-full border border-[var(--accent)] bg-[var(--surface)] shadow-[0_0_55px_var(--accent-soft)]">
            <Icon
              icon="solar:shield-check-bold"
              className="text-4xl text-[var(--accent)]"
            />
            <span className="aqua-mono mt-2 text-[.58rem] tracking-widest">
              ZK PROOF
            </span>
          </div>
          <div className="absolute left-1/2 top-[12%] h-[13%] w-px bg-gradient-to-b from-[var(--accent)] to-transparent" />
          <div className="absolute bottom-[18%] right-[18%] h-3 w-3 rounded-full bg-[var(--success)] shadow-[0_0_16px_var(--success)]" />
          <div className="absolute left-[18%] top-[30%] h-2 w-2 rounded-full bg-[var(--accent)]" />
        </div>
        <div>
          <p className="aqua-kicker">Privacy architecture</p>
          <h2 className="mt-5 text-4xl font-bold tracking-[-.045em] sm:text-5xl">
            Proof without exposure.
          </h2>
          <p className="mt-6 max-w-xl leading-7 text-[var(--muted)]">
            The diagram is the product boundary: sensitive source data remains
            private while Midnight anchors a public, time-bound assurance
            result.
          </p>
          <div className="mt-10 space-y-8">
            {boundaries.map((boundary, index) => (
              <div
                key={boundary.title}
                className="grid grid-cols-[36px_1fr] gap-4"
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-[var(--border)] bg-[var(--surface-soft)] text-[var(--accent)]">
                  <Icon icon={boundary.icon} />
                </div>
                <div>
                  <p className="font-semibold">
                    <span className="aqua-mono mr-2 text-xs text-[var(--faint)]">
                      0{index + 1}
                    </span>
                    {boundary.title}
                  </p>
                  <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
                    {boundary.body}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
