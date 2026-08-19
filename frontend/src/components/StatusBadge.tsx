import type { SnapshotStatus } from "@/lib/types";

const tone: Record<SnapshotStatus, string> = {
  VERIFIED:
    "text-[var(--success)] border-[color-mix(in_srgb,var(--success)_40%,transparent)] bg-[color-mix(in_srgb,var(--success)_8%,transparent)]",
  SHORTFALL:
    "text-[var(--danger)] border-[color-mix(in_srgb,var(--danger)_40%,transparent)] bg-[color-mix(in_srgb,var(--danger)_8%,transparent)]",
  REVOKED:
    "text-[var(--danger)] border-[color-mix(in_srgb,var(--danger)_40%,transparent)] bg-[color-mix(in_srgb,var(--danger)_8%,transparent)]",
  EXPIRED:
    "text-[var(--warning)] border-[color-mix(in_srgb,var(--warning)_40%,transparent)] bg-[color-mix(in_srgb,var(--warning)_8%,transparent)]",
  PENDING_ATTESTATION:
    "text-[var(--accent)] border-[color-mix(in_srgb,var(--accent)_40%,transparent)] bg-[var(--accent-soft)]",
  INVALID:
    "text-[var(--danger)] border-[color-mix(in_srgb,var(--danger)_40%,transparent)] bg-[color-mix(in_srgb,var(--danger)_8%,transparent)]",
  UNAVAILABLE:
    "text-[var(--muted)] border-[var(--border)] bg-[var(--surface-soft)]",
};

export default function StatusBadge({ status }: { status: SnapshotStatus }) {
  return (
    <span
      className={`inline-flex rounded-full border px-2.5 py-1 text-[.68rem] font-bold tracking-[.08em] ${tone[status]}`}
    >
      {status.replaceAll("_", " ")}
    </span>
  );
}
