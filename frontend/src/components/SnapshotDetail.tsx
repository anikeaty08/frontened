import { Icon } from "@iconify/react";
import { compactHash, formatDate } from "@/lib/api";
import type { PublicSnapshot } from "@/lib/types";
import StatusBadge from "./StatusBadge";

const Field = ({
  label,
  value,
  mono = false,
}: {
  label: string;
  value: string | null;
  mono?: boolean;
}) => (
  <div className="border-b aqua-divider py-4 last:border-0">
    <dt className="text-xs text-[var(--faint)]">{label}</dt>
    <dd className={`mt-2 break-all text-sm ${mono ? "aqua-mono" : ""}`}>
      {value || "Not available"}
    </dd>
  </div>
);

export default function SnapshotDetail({
  snapshot,
}: {
  snapshot: PublicSnapshot;
}) {
  return (
    <div className="grid gap-8 lg:grid-cols-12">
      <div className="space-y-8 lg:col-span-7">
        <section className="aqua-panel rounded-xl p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="aqua-kicker">Coverage result</p>
              <h2 className="mt-4 text-3xl font-bold">
                {snapshot.asset.code} reserve snapshot
              </h2>
            </div>
            <StatusBadge status={snapshot.status} />
          </div>
          <div className="mt-8 grid gap-6 sm:grid-cols-3">
            <div>
              <p className="text-xs text-[var(--faint)]">Cutoff</p>
              <p className="mt-2 text-sm">{formatDate(snapshot.cutoffAt)}</p>
            </div>
            <div>
              <p className="text-xs text-[var(--faint)]">Expires</p>
              <p className="mt-2 text-sm">{formatDate(snapshot.expiresAt)}</p>
            </div>
            <div>
              <p className="text-xs text-[var(--faint)]">Attested</p>
              <p className="mt-2 text-sm">{formatDate(snapshot.attestedAt)}</p>
            </div>
          </div>
          {snapshot.revocationReason && (
            <div className="mt-7 rounded-lg border border-[var(--danger)] bg-[color-mix(in_srgb,var(--danger)_7%,transparent)] p-4 text-sm text-[var(--danger)]">
              <strong>Revoked:</strong> {snapshot.revocationReason}
            </div>
          )}
        </section>
        <section className="rounded-xl border aqua-divider bg-[var(--surface)] p-6">
          <p className="aqua-kicker">Declared scope</p>
          <h3 className="mt-4 text-xl font-semibold">
            {snapshot.scope.liabilityDefinition}
          </h3>
          <div className="mt-7 grid gap-7 sm:grid-cols-2">
            <div>
              <p className="text-xs font-semibold text-[var(--faint)]">
                Included
              </p>
              <ul className="mt-3 space-y-2 text-sm">
                {snapshot.scope.includedCategories.map((item) => (
                  <li key={item} className="flex gap-2">
                    <Icon
                      icon="solar:check-circle-linear"
                      className="mt-0.5 text-[var(--success)]"
                    />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <p className="text-xs font-semibold text-[var(--faint)]">
                Excluded
              </p>
              <ul className="mt-3 space-y-2 text-sm">
                {snapshot.scope.excludedCategories.map((item) => (
                  <li key={item} className="flex gap-2">
                    <Icon
                      icon="solar:minus-circle-linear"
                      className="mt-0.5 text-[var(--warning)]"
                    />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <div className="mt-7 border-t aqua-divider pt-6 text-sm leading-6 text-[var(--muted)]">
            <strong className="text-[var(--text)]">Limitations.</strong>{" "}
            {snapshot.scope.limitations}
          </div>
        </section>
      </div>
      <aside className="space-y-8 lg:col-span-5">
        <section className="rounded-xl border aqua-divider bg-[var(--surface)] p-6">
          <p className="aqua-kicker">Midnight evidence</p>
          <dl className="mt-4">
            <Field
              label="Network"
              value={
                snapshot.anchor.mode === "MIDNIGHT_PREPROD"
                  ? "Midnight Preprod"
                  : "Development"
              }
            />
            <Field
              label="Contract address"
              value={snapshot.anchor.contractAddress}
              mono
            />
            <Field
              label="Deployment transaction"
              value={snapshot.anchor.transactionId}
              mono
            />
            <Field
              label="Anchor commitment"
              value={snapshot.anchor.commitment}
              mono
            />
            <Field
              label="Scope manifest"
              value={snapshot.scopeManifestHash}
              mono
            />
          </dl>
        </section>
        <section className="rounded-xl border aqua-divider bg-[var(--surface)] p-6">
          <p className="aqua-kicker">Commitments</p>
          <dl className="mt-4">
            <Field
              label="Liability commitment"
              value={snapshot.liabilityCommitment}
              mono
            />
            <Field
              label="Membership root"
              value={snapshot.membershipRoot}
              mono
            />
            <Field
              label="Reserve evidence"
              value={snapshot.reserveEvidenceCommitment}
              mono
            />
            <Field
              label="Coverage evidence"
              value={snapshot.coverageEvidenceCommitment}
              mono
            />
          </dl>
          <p className="mt-5 text-xs leading-5 text-[var(--faint)]">
            Compact view: {compactHash(snapshot.anchor.contractAddress, 10)}
          </p>
        </section>
      </aside>
    </div>
  );
}
