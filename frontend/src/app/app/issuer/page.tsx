"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { Icon } from "@iconify/react";
import AppShell from "@/components/AppShell";
import LifecycleTimeline from "@/components/LifecycleTimeline";
import SnapshotTable from "@/components/SnapshotTable";
import StatusBadge from "@/components/StatusBadge";
import WorkspaceHeader from "@/components/WorkspaceHeader";
import { ApiError, apiRequest, compactHash } from "@/lib/api";
import type {
  PublicSnapshot,
  SnapshotEvent,
  SnapshotListResponse,
} from "@/lib/types";

const tomorrow = () => new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
const now = () => new Date().toISOString();

export default function IssuerWorkspace() {
  const [snapshots, setSnapshots] = useState<PublicSnapshot[]>([]);
  const [selected, setSelected] = useState<PublicSnapshot | null>(null);
  const [events, setEvents] = useState<SnapshotEvent[]>([]);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [recoverKey, setRecoverKey] = useState("");
  const [reason, setReason] = useState("");
  const [form, setForm] = useState({
    idempotencyKey: `aqua-${crypto.randomUUID()}`,
    issuerId: "",
    attesterId: "",
    assetCode: "DUSD",
    decimals: "6",
    cutoffAt: now().slice(0, 16),
    expiresAt: tomorrow().slice(0, 16),
    reserveTotalBaseUnits: "",
    reserveEvidenceReference: "",
    liabilityDefinition: "Customer spot balances held by the custodian.",
    includedCategories: "customer spot balances",
    excludedCategories: "margin balances, corporate treasury",
    limitations:
      "Point-in-time reserve assurance within the declared scope. This is not a financial audit.",
    liabilities: '[{"customerId":"customer-001","balanceBaseUnits":"1000000"}]',
  });
  const load = useCallback(async () => {
    try {
      const data = await apiRequest<SnapshotListResponse>(
        "/v1/issuer/snapshots?limit=50",
      );
      setSnapshots(data.snapshots);
    } catch (cause) {
      setError(
        cause instanceof ApiError
          ? cause.message
          : "Issuer snapshots could not be loaded.",
      );
    }
  }, []);
  useEffect(() => {
    let active = true;
    void apiRequest<SnapshotListResponse>("/v1/issuer/snapshots?limit=50")
      .then((data) => {
        if (active) setSnapshots(data.snapshots);
      })
      .catch((cause) => {
        if (active)
          setError(
            cause instanceof ApiError
              ? cause.message
              : "Issuer snapshots could not be loaded.",
          );
      });
    return () => {
      active = false;
    };
  }, []);
  const select = async (snapshot: PublicSnapshot) => {
    setSelected(snapshot);
    setEvents([]);
    try {
      const data = await apiRequest<{ events: SnapshotEvent[] }>(
        `/v1/snapshots/${snapshot.id}/events`,
      );
      setEvents(data.events);
    } catch (cause) {
      setError(
        cause instanceof ApiError
          ? cause.message
          : "Events could not be loaded.",
      );
    }
  };
  const run = async (
    action: () => Promise<PublicSnapshot>,
    success: string,
  ) => {
    setBusy(true);
    setError(null);
    try {
      const snapshot = await action();
      setSelected(snapshot);
      setNotice(success);
      await load();
      await select(snapshot);
    } catch (cause) {
      setError(
        cause instanceof ApiError ? cause.message : "The operation failed.",
      );
    } finally {
      setBusy(false);
    }
  };
  const publish = async (event: FormEvent) => {
    event.preventDefault();
    let liabilities;
    try {
      liabilities = JSON.parse(form.liabilities);
    } catch {
      setError("Liabilities must be valid JSON.");
      return;
    }
    await run(
      async () =>
        (
          await apiRequest<{ snapshot: PublicSnapshot }>("/v1/snapshots", {
            method: "POST",
            headers: {
              "content-type": "application/json",
              "idempotency-key": form.idempotencyKey,
            },
            body: JSON.stringify({
              issuerId: form.issuerId,
              attesterId: form.attesterId,
              asset: { code: form.assetCode, decimals: Number(form.decimals) },
              scope: {
                liabilityDefinition: form.liabilityDefinition,
                includedCategories: form.includedCategories
                  .split(",")
                  .map((v) => v.trim())
                  .filter(Boolean),
                excludedCategories: form.excludedCategories
                  .split(",")
                  .map((v) => v.trim())
                  .filter(Boolean),
                limitations: form.limitations,
              },
              cutoffAt: new Date(form.cutoffAt).toISOString(),
              expiresAt: new Date(form.expiresAt).toISOString(),
              reserveTotalBaseUnits: form.reserveTotalBaseUnits,
              reserveEvidenceReference: form.reserveEvidenceReference,
              liabilities,
            }),
          })
        ).snapshot,
      "Snapshot published and deployment result recorded.",
    );
  };
  const recover = async (event: FormEvent) => {
    event.preventDefault();
    await run(
      async () =>
        (
          await apiRequest<{ snapshot: PublicSnapshot }>(
            "/v1/issuer/snapshots/by-idempotency-key",
            { headers: { "idempotency-key": recoverKey } },
          )
        ).snapshot,
      "Existing publication recovered without another deployment.",
    );
  };
  return (
    <AppShell>
      <WorkspaceHeader
        role="Issuer"
        description="Publish immutable snapshots and safely manage their Midnight lifecycle."
      />
      <div className="mx-auto grid max-w-[92rem] gap-8 px-5 py-10 xl:grid-cols-12 lg:px-8">
        <section className="space-y-8 xl:col-span-7">
          <div>
            <h2 className="text-xl font-semibold">Your snapshots</h2>
            <p className="mt-2 text-sm text-[var(--muted)]">
              Select a snapshot to inspect events or perform an authorized
              lifecycle action.
            </p>
          </div>
          <div
            onClick={(event) => {
              const link = (event.target as HTMLElement).closest("a");
              if (link) {
                event.preventDefault();
                const id = link.getAttribute("href")?.split("/").pop();
                const snapshot = snapshots.find((item) => item.id === id);
                if (snapshot) void select(snapshot);
              }
            }}
          >
            <SnapshotTable
              snapshots={snapshots}
              emptyMessage="No issuer snapshots yet. Publish the first one from this workspace."
            />
          </div>
          {selected && (
            <div className="aqua-panel rounded-xl p-6">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="aqua-kicker">Selected snapshot</p>
                  <h3 className="aqua-mono mt-3 text-sm">
                    {compactHash(selected.id, 12)}
                  </h3>
                </div>
                <StatusBadge status={selected.status} />
              </div>
              <div className="mt-7 grid gap-3 sm:grid-cols-2">
                <button
                  disabled={busy}
                  className="aqua-button aqua-button-secondary"
                  onClick={() =>
                    void run(
                      async () =>
                        (
                          await apiRequest<{ snapshot: PublicSnapshot }>(
                            `/v1/snapshots/${selected.id}/reconcile`,
                            {
                              method: "POST",
                              headers: { "content-type": "application/json" },
                              body: "{}",
                            },
                          )
                        ).snapshot,
                      "Lifecycle reconciled from Midnight.",
                    )
                  }
                >
                  <Icon icon="solar:refresh-circle-linear" />
                  Reconcile
                </button>
                <button
                  disabled={
                    busy ||
                    selected.anchor.status !== "DEPLOYING" ||
                    Boolean(selected.anchor.contractAddress)
                  }
                  className="aqua-button aqua-button-secondary text-[var(--danger)]"
                  onClick={() =>
                    void run(
                      async () =>
                        (
                          await apiRequest<{ snapshot: PublicSnapshot }>(
                            `/v1/snapshots/${selected.id}/reconcile`,
                            {
                              method: "POST",
                              headers: { "content-type": "application/json" },
                              body: JSON.stringify({ abandonDeployment: true }),
                            },
                          )
                        ).snapshot,
                      "Addressless deployment marked abandoned.",
                    )
                  }
                >
                  Abandon rejected deploy
                </button>
              </div>
              <div className="mt-5 flex flex-col gap-3 sm:flex-row">
                <input
                  className="aqua-input"
                  placeholder="Revocation reason (minimum 10 characters)"
                  value={reason}
                  onChange={(event) => setReason(event.target.value)}
                />
                <button
                  disabled={
                    busy ||
                    reason.trim().length < 10 ||
                    Boolean(selected.revokedAt)
                  }
                  className="aqua-button aqua-button-secondary shrink-0 text-[var(--danger)]"
                  onClick={() =>
                    void run(
                      async () =>
                        (
                          await apiRequest<{ snapshot: PublicSnapshot }>(
                            `/v1/snapshots/${selected.id}/revoke`,
                            {
                              method: "POST",
                              headers: { "content-type": "application/json" },
                              body: JSON.stringify({ reason }),
                            },
                          )
                        ).snapshot,
                      "Snapshot revoked on Midnight.",
                    )
                  }
                >
                  Revoke
                </button>
              </div>
              <div className="mt-8 border-t aqua-divider pt-7">
                <h4 className="mb-6 font-semibold">Lifecycle events</h4>
                <LifecycleTimeline events={events} />
              </div>
            </div>
          )}
        </section>
        <aside className="space-y-8 xl:col-span-5">
          <form
            onSubmit={recover}
            className="rounded-xl border aqua-divider bg-[var(--surface)] p-6"
          >
            <p className="aqua-kicker">Safe recovery</p>
            <h2 className="mt-4 text-xl font-semibold">
              Recover by idempotency key
            </h2>
            <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
              Use after a response timeout. This never submits another contract.
            </p>
            <input
              className="aqua-input mt-5"
              value={recoverKey}
              onChange={(event) => setRecoverKey(event.target.value)}
              minLength={16}
              required
              placeholder="Original idempotency key"
            />
            <button
              disabled={busy}
              className="aqua-button aqua-button-secondary mt-3 w-full"
            >
              Recover publication
            </button>
          </form>
          <form onSubmit={publish} className="aqua-panel rounded-xl p-6">
            <p className="aqua-kicker">New immutable snapshot</p>
            <h2 className="mt-4 text-xl font-semibold">
              Publish reserve evidence
            </h2>
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <label className="text-xs text-[var(--muted)]">
                Issuer ID
                <input
                  className="aqua-input mt-2"
                  value={form.issuerId}
                  onChange={(e) =>
                    setForm({ ...form, issuerId: e.target.value })
                  }
                  required
                />
              </label>
              <label className="text-xs text-[var(--muted)]">
                Attester ID
                <input
                  className="aqua-input mt-2"
                  value={form.attesterId}
                  onChange={(e) =>
                    setForm({ ...form, attesterId: e.target.value })
                  }
                  required
                />
              </label>
              <label className="text-xs text-[var(--muted)]">
                Asset code
                <input
                  className="aqua-input mt-2"
                  value={form.assetCode}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      assetCode: e.target.value.toUpperCase(),
                    })
                  }
                  required
                />
              </label>
              <label className="text-xs text-[var(--muted)]">
                Decimals
                <input
                  className="aqua-input mt-2"
                  type="number"
                  min="0"
                  max="18"
                  value={form.decimals}
                  onChange={(e) =>
                    setForm({ ...form, decimals: e.target.value })
                  }
                  required
                />
              </label>
              <label className="text-xs text-[var(--muted)]">
                Cutoff
                <input
                  className="aqua-input mt-2"
                  type="datetime-local"
                  value={form.cutoffAt}
                  onChange={(e) =>
                    setForm({ ...form, cutoffAt: e.target.value })
                  }
                  required
                />
              </label>
              <label className="text-xs text-[var(--muted)]">
                Expiry
                <input
                  className="aqua-input mt-2"
                  type="datetime-local"
                  value={form.expiresAt}
                  onChange={(e) =>
                    setForm({ ...form, expiresAt: e.target.value })
                  }
                  required
                />
              </label>
            </div>
            <label className="mt-4 block text-xs text-[var(--muted)]">
              Idempotency key
              <input
                className="aqua-input mt-2"
                value={form.idempotencyKey}
                onChange={(e) =>
                  setForm({ ...form, idempotencyKey: e.target.value })
                }
                minLength={16}
                required
              />
            </label>
            <label className="mt-4 block text-xs text-[var(--muted)]">
              Reserve total in base units
              <input
                className="aqua-input mt-2"
                inputMode="numeric"
                value={form.reserveTotalBaseUnits}
                onChange={(e) =>
                  setForm({ ...form, reserveTotalBaseUnits: e.target.value })
                }
                required
                pattern="[0-9]+"
              />
            </label>
            <label className="mt-4 block text-xs text-[var(--muted)]">
              Reserve evidence reference
              <input
                className="aqua-input mt-2"
                value={form.reserveEvidenceReference}
                onChange={(e) =>
                  setForm({ ...form, reserveEvidenceReference: e.target.value })
                }
                required
                minLength={16}
              />
            </label>
            <label className="mt-4 block text-xs text-[var(--muted)]">
              Liability definition
              <textarea
                className="aqua-input mt-2"
                value={form.liabilityDefinition}
                onChange={(e) =>
                  setForm({ ...form, liabilityDefinition: e.target.value })
                }
                required
              />
            </label>
            <label className="mt-4 block text-xs text-[var(--muted)]">
              Included categories
              <input
                className="aqua-input mt-2"
                value={form.includedCategories}
                onChange={(e) =>
                  setForm({ ...form, includedCategories: e.target.value })
                }
              />
            </label>
            <label className="mt-4 block text-xs text-[var(--muted)]">
              Excluded categories
              <input
                className="aqua-input mt-2"
                value={form.excludedCategories}
                onChange={(e) =>
                  setForm({ ...form, excludedCategories: e.target.value })
                }
              />
            </label>
            <label className="mt-4 block text-xs text-[var(--muted)]">
              Limitations
              <textarea
                className="aqua-input mt-2"
                value={form.limitations}
                onChange={(e) =>
                  setForm({ ...form, limitations: e.target.value })
                }
                required
                minLength={20}
              />
            </label>
            <label className="mt-4 block text-xs text-[var(--muted)]">
              Liabilities JSON
              <textarea
                className="aqua-input aqua-mono mt-2 min-h-40 text-xs"
                value={form.liabilities}
                onChange={(e) =>
                  setForm({ ...form, liabilities: e.target.value })
                }
                required
              />
            </label>
            {error && (
              <p className="mt-5 text-sm text-[var(--danger)]">{error}</p>
            )}
            {notice && (
              <p className="mt-5 text-sm text-[var(--success)]">{notice}</p>
            )}
            <button
              disabled={busy}
              className="aqua-button aqua-button-primary mt-6 w-full"
            >
              {busy ? "Submitting securely…" : "Publish snapshot"}
            </button>
          </form>
        </aside>
      </div>
    </AppShell>
  );
}
