import { Icon } from "@iconify/react";

export default function Pricing() {
  return (
    <section className="py-32 px-6 lg:px-12 w-full relative z-10 bg-black border-t border-[#151515]">
      <div className="w-full max-w-[100rem] mx-auto reveal">
        <div className="mb-20 flex flex-col md:flex-row justify-between items-end gap-8 border-b border-[#151515] pb-8">
          <div>
            <h2 className="text-3xl md:text-5xl font-bold tracking-tighter text-white uppercase mb-4">
              Delivery Roadmap
            </h2>
            <p className="text-sm text-[#777] font-mono tracking-widest uppercase">Each phase extends assurance without widening the public claim.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch">
          {/* Tier 1 */}
          <div className="glass-panel corner-brackets p-8 flex flex-col hover:border-[#333] transition-colors duration-500">
            <div className="mb-6">
              <div className="text-[0.65rem] font-mono text-[#777] uppercase tracking-widest mb-2">Phase_01</div>
              <h3 className="text-2xl font-bold text-white uppercase tracking-tight">Snapshot</h3>
            </div>
            <div className="text-4xl font-mono text-white mb-8 border-b border-[#1A1A1A] pb-8">
              1<span className="text-lg text-[#555] ml-1 uppercase">Asset</span>
            </div>
            <ul className="text-xs font-mono text-[#777] space-y-4 mb-12 flex-1">
              <li className="flex items-center gap-3">
                <Icon icon="solar:check-circle-linear" className="text-white text-base" /> Scoped, immutable reserve snapshot
              </li>
              <li className="flex items-center gap-3">
                <Icon icon="solar:check-circle-linear" className="text-white text-base" /> Private customer inclusion receipts
              </li>
              <li className="flex items-center gap-3">
                <Icon icon="solar:check-circle-linear" className="text-white text-base" /> Expiry, revocation, and shortfall states
              </li>
            </ul>
            <a href="#deployment" className="btn-hex w-full py-4 text-xs text-center">
              <span className="relative z-10 w-full">View Snapshot</span>
            </a>
          </div>

          {/* Tier 2 (Highlighted) */}
          <div className="bg-[#050505] border border-[#0052FF] p-8 flex flex-col relative shadow-[0_0_30px_rgba(0,82,255,0.1)] transform md:-translate-y-4">
            <div className="absolute top-0 left-0 w-full h-1 bg-[#0052FF]"></div>
            <div className="mb-6">
              <div className="flex justify-between items-center mb-2">
                <div className="text-[0.65rem] font-mono text-[#0052FF] uppercase tracking-widest">Phase_02</div>
                <span className="text-[0.6rem] font-mono bg-[rgba(0,82,255,0.1)] text-[#0052FF] px-2 py-1">
                  NEXT
                </span>
              </div>
              <h3 className="text-2xl font-bold text-white uppercase tracking-tight">Assurance</h3>
            </div>
            <div className="text-4xl font-mono text-white mb-8 border-b border-[#1A1A1A] pb-8">
              Multi<span className="text-lg text-[#555] ml-1 uppercase">Asset</span>
            </div>
            <ul className="text-xs font-mono text-[#DDD] space-y-4 mb-12 flex-1">
              <li className="flex items-center gap-3">
                <Icon icon="solar:check-circle-bold" className="text-[#0052FF] text-base" /> Asset-by-asset snapshot history
              </li>
              <li className="flex items-center gap-3">
                <Icon icon="solar:check-circle-bold" className="text-[#0052FF] text-base" /> Issuer and attester registry
              </li>
              <li className="flex items-center gap-3">
                <Icon icon="solar:check-circle-bold" className="text-[#0052FF] text-base" /> Reconciliation and reserve-control evidence
              </li>
              <li className="flex items-center gap-3">
                <Icon icon="solar:check-circle-bold" className="text-[#0052FF] text-base" /> Auditor-only evidence packages
              </li>
            </ul>
            <a href="#deployment" className="btn-hex btn-hex-primary w-full py-4 text-xs text-center">
              <span className="relative z-10 w-full">Explore Assurance</span>
            </a>
          </div>

          {/* Tier 3 */}
          <div className="glass-panel corner-brackets p-8 flex flex-col hover:border-[#333] transition-colors duration-500">
            <div className="mb-6">
              <div className="text-[0.65rem] font-mono text-[#777] uppercase tracking-widest mb-2">Phase_03</div>
              <h3 className="text-2xl font-bold text-white uppercase tracking-tight">Platform</h3>
            </div>
            <div className="text-4xl font-mono text-white mb-8 border-b border-[#1A1A1A] pb-8">API</div>
            <ul className="text-xs font-mono text-[#777] space-y-4 mb-12 flex-1">
              <li className="flex items-center gap-3">
                <Icon icon="solar:check-circle-linear" className="text-white text-base" /> Scheduled issuer publishing
              </li>
              <li className="flex items-center gap-3">
                <Icon icon="solar:check-circle-linear" className="text-white text-base" /> Partner API and verification widget
              </li>
              <li className="flex items-center gap-3">
                <Icon icon="solar:check-circle-linear" className="text-white text-base" /> Monitoring and incident notifications
              </li>
            </ul>
            <a href="#deployment" className="btn-hex w-full py-4 text-xs text-center">
              <span className="relative z-10 w-full">Plan Integration</span>
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
