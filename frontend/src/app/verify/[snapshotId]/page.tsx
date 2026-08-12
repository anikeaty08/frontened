"use client";

import { FormEvent, use, useState } from "react";
import { Icon } from "@iconify/react";
import AppShell from "@/components/AppShell";
import PageHeader from "@/components/PageHeader";
import StatusBadge from "@/components/StatusBadge";
import { ApiError, apiRequest, compactHash, createSession } from "@/lib/api";
import type { CustomerVerification } from "@/lib/types";

export default function CustomerVerificationPage({
  params,
}: {
  params: Promise<{ snapshotId: string }>;
}) {
  const { snapshotId } = use(params);
  const [token, setToken] = useState("");
  const [result, setResult] = useState<CustomerVerification | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const verify = async (event: FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await createSession(token, "CUSTOMER");
      const response = await apiRequest<{ verification: CustomerVerification }>(
        `/v1/customer/snapshots/${snapshotId}/verification`,
      );
      setResult(response.verification);
      setToken("");
    } catch (cause) {
      setError(
        cause instanceof ApiError
          ? cause.message
          : cause instanceof Error
            ? cause.message
            : "Verification failed.",
      );
    } finally {
      setLoading(false);
    }
  };
  return (
    <AppShell>
      <PageHeader
        eyebrow="Private verification"
        title="Customer inclusion"
        description={`Snapshot ${compactHash(snapshotId, 10)}`}
      />
      <section className="mx-auto max-w-3xl px-5 py-12 lg:px-8">
        {!result && (
          <form onSubmit={verify} className="aqua-panel rounded-2xl p-6 sm:p-8">
            <div className="flex items-start gap-4">
              <Icon
                icon="solar:shield-keyhole-bold"
                className="mt-1 text-3xl text-[var(--accent)]"
              />
              <div>
                <h2 className="text-xl font-semibold">
                  Customer access required
                </h2>
                <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
                  The credential is sent only to the same-origin server and
                  placed in an HttpOnly, SameSite session cookie. It is not
                  stored in browser JavaScript storage.
                </p>
              </div>
            </div>
            <label
              htmlFor="customer-token"
              className="mt-8 block text-sm font-semibold"
            >
              Customer access credential
            </label>
            <input
              id="customer-token"
              type="password"
              autoComplete="current-password"
              className="aqua-input mt-3"
              value={token}
              onChange={(event) => setToken(event.target.value)}
              required
            />
            <button
              disabled={loading}
              className="aqua-button aqua-button-primary mt-5 w-full"
              type="submit"
            >
              {loading ? "Verifying…" : "Verify inclusion"}
            </button>
          </form>
        )}
        {error && (
          <div className="mt-5 rounded-xl border border-[var(--danger)] p-4 text-sm text-[var(--danger)]">
            {error}
          </div>
        )}
        {result && (
          <div className="aqua-panel rounded-2xl p-6 sm:p-8">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="aqua-kicker">Verification result</p>
                <h2 className="mt-4 text-3xl font-bold">
                  {result.included && result.cryptographicallyValid
                    ? "Balance included"
                    : "Balance not included"}
                </h2>
              </div>
              <StatusBadge status={result.currentStatus} />
            </div>
            <div
              className={`mt-8 rounded-xl border p-5 ${result.included && result.cryptographicallyValid ? "border-[var(--success)] bg-[color-mix(in_srgb,var(--success)_7%,transparent)]" : "border-[var(--warning)] bg-[color-mix(in_srgb,var(--warning)_7%,transparent)]"}`}
            >
              <Icon
                icon={
                  result.included && result.cryptographicallyValid
                    ? "solar:verified-check-bold"
                    : "solar:danger-triangle-linear"
                }
                className="text-3xl"
              />
              <p className="mt-3 text-sm leading-6">
                {result.included && result.cryptographicallyValid
                  ? "Your encrypted receipt opened successfully and its Merkle path matches the public membership root."
                  : "No valid receipt for this customer was found in the selected snapshot."}
              </p>
            </div>
            {result.receipt && (
              <dl className="mt-7 grid gap-5 sm:grid-cols-2">
                <div>
                  <dt className="text-xs text-[var(--faint)]">
                    Balance in base units
                  </dt>
                  <dd className="aqua-mono mt-2 break-all text-sm">
                    {result.receipt.balanceBaseUnits}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-[var(--faint)]">Proof path</dt>
                  <dd className="mt-2 text-sm">
                    {result.receipt.proof.length} Merkle steps
                  </dd>
                </div>
                <div className="sm:col-span-2">
                  <dt className="text-xs text-[var(--faint)]">
                    Membership root
                  </dt>
                  <dd className="aqua-mono mt-2 break-all text-xs">
                    {result.receipt.membershipRoot}
                  </dd>
                </div>
              </dl>
            )}
            <button
              className="aqua-button aqua-button-secondary mt-8"
              onClick={() => setResult(null)}
            >
              Verify again
            </button>
          </div>
        )}
      </section>
    </AppShell>
  );
}
