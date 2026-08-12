import { Icon } from "@iconify/react";

export default function ArsenalGrid() {
  return (
    <section className="py-32 px-6 lg:px-12 w-full relative z-10 bg-[#030303] border-t border-[#151515]">
      <div className="max-w-[100rem] mx-auto">
        <div className="mb-20 reveal max-w-2xl">
          <h2 className="text-3xl md:text-5xl font-bold tracking-tighter text-white uppercase mb-6">The proof boundary.</h2>
          <p className="text-sm md:text-base text-[#777] font-light leading-relaxed">
            AquaReserve makes each public claim specific, cryptographically supported, and safe to inspect without exposing private reserve or customer data.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 reveal stagger-group">
          {/* Card 1 */}
          <div className="glass-panel p-8 corner-brackets group stagger-item flex flex-col hover:bg-[#080808] transition-colors duration-500">
            <Icon
              icon="solar:shield-warning-linear"
              className="text-3xl text-white mb-8 group-hover:text-[#0052FF] transition-colors"
            />
            <h3 className="text-lg font-bold text-white uppercase tracking-tight mb-3 font-mono">Coverage Evidence</h3>
            <p className="text-sm text-[#777] font-light leading-relaxed flex-1">
              A private liability commitment and reserve-evidence commitment bind the same-asset coverage result to a defined snapshot.
            </p>
            <div className="mt-8 pt-4 border-t border-[#1A1A1A] text-[0.65rem] font-mono text-[#555] uppercase">
              Spec: Merkle-sum commitment
            </div>
          </div>

          {/* Card 2 */}
          <div className="glass-panel p-8 corner-brackets group stagger-item flex flex-col hover:bg-[#080808] transition-colors duration-500">
            <Icon
              icon="solar:routing-3-linear"
              className="text-3xl text-white mb-8 group-hover:text-[#0052FF] transition-colors"
            />
            <h3 className="text-lg font-bold text-white uppercase tracking-tight mb-3 font-mono">Private Inclusion</h3>
            <p className="text-sm text-[#777] font-light leading-relaxed flex-1">
              Every covered customer receives an encrypted receipt to verify only their own inclusion without exposing a balance or identity.
            </p>
            <div className="mt-8 pt-4 border-t border-[#1A1A1A] text-[0.65rem] font-mono text-[#555] uppercase">
              Spec: Encrypted customer receipt
            </div>
          </div>

          {/* Card 3 */}
          <div className="glass-panel p-8 corner-brackets group stagger-item flex flex-col hover:bg-[#080808] transition-colors duration-500">
            <Icon
              icon="solar:server-square-update-linear"
              className="text-3xl text-white mb-8 group-hover:text-[#0052FF] transition-colors"
            />
            <h3 className="text-lg font-bold text-white uppercase tracking-tight mb-3 font-mono">Scoped Transparency</h3>
            <p className="text-sm text-[#777] font-light leading-relaxed flex-1">
              The public record carries issuer, attester, timestamp, expiry, limitations, scope hash, and proof status—never raw evidence.
            </p>
            <div className="mt-8 pt-4 border-t border-[#1A1A1A] text-[0.65rem] font-mono text-[#555] uppercase">
              Spec: Midnight snapshot record
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
