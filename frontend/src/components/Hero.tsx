import { Icon } from "@iconify/react";

export default function Hero() {
  return (
    <section className="relative min-h-screen flex items-center pt-32 pb-20 px-6 lg:px-12 z-10">
      <div className="w-full h-full max-w-[100rem] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 relative items-center">
        
        <div className="lg:col-span-8 flex flex-col items-start relative z-20">
          <div className="sys-badge inline-flex items-center gap-3 px-4 py-1.5 rounded-none mb-8 animate-[fadeIn_1s_ease_out]">
            <span className="w-1.5 h-1.5 bg-[#0052FF] rounded-full animate-pulse shadow-[0_0_8px_#0052FF]"></span>
            <span className="text-xs font-mono text-white tracking-widest uppercase">Proof Status: Verified</span>
            <span className="text-[0.6rem] text-[#777] ml-2 hidden sm:inline-block">MIDNIGHT // ACTIVE</span>
          </div>

          <h1 className="text-[clamp(3.5rem,7vw,7rem)] font-bold leading-[0.95] tracking-tighter text-white mb-6 uppercase">
            <span className="block reveal" style={{ transitionDelay: "0.1s" }}>
              Prove Coverage.
            </span>
            <span className="block reveal text-[#777777]" style={{ transitionDelay: "0.2s" }}>
              Preserve Privacy.
            </span>
          </h1>

          <p
            className="text-sm md:text-base lg:text-lg font-light leading-relaxed text-[#888888] max-w-2xl mb-12 reveal border-l-2 border-[#151515] pl-6"
            style={{ transitionDelay: "0.3s" }}
          >
            AquaReserve lets custodial platforms publish a cryptographically verifiable, time-bound reserve snapshot while keeping customer balances, identities, and reserve-wallet structure private.
          </p>

          <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto reveal" style={{ transitionDelay: "0.4s" }}>
            <a href="#deployment" className="btn-hex btn-hex-primary w-full sm:w-auto px-10 py-5 text-sm">
              <span className="relative z-10 flex items-center gap-3">
                Verify Snapshot <Icon icon="solar:arrow-right-linear" className="text-lg" />
              </span>
            </a>
            <a href="#intelligence" className="btn-hex w-full sm:w-auto px-10 py-5 text-sm">
              <span className="relative z-10 flex items-center gap-3">
                <Icon icon="solar:shield-check-linear" className="text-lg" /> View Scope
              </span>
            </a>
          </div>

          <div className="mt-16 flex items-center gap-8 reveal" style={{ transitionDelay: "0.5s" }}>
            <div className="flex flex-col">
              <span className="text-2xl font-mono text-white tracking-tight">25</span>
              <span className="text-xs text-[#777] uppercase tracking-widest mt-1">Synthetic Customers</span>
            </div>
            <div className="w-px h-10 bg-[#151515]"></div>
            <div className="flex flex-col">
              <span className="text-2xl font-mono text-white tracking-tight">DUSD</span>
              <span className="text-xs text-[#777] uppercase tracking-widest mt-1">Covered Native Asset</span>
            </div>
          </div>
        </div>

        {/* Right: Technical Decoration */}
        <div className="lg:col-span-4 hidden lg:flex flex-col justify-center items-end relative reveal" style={{ transitionDelay: "0.6s" }}>
          <div className="w-full max-w-sm glass-panel p-6 corner-brackets">
            <div className="flex justify-between items-center mb-6 pb-4 border-b border-[#151515]">
              <span className="text-xs font-mono text-[#777] uppercase tracking-widest">Snapshot Record</span>
              <Icon icon="solar:shield-check-linear" className="text-[#0052FF] text-xl" />
            </div>
            <div className="space-y-4">
              <div className="flex justify-between text-xs font-mono">
                <span className="text-[#555]">Coverage proof</span>
                <span className="text-white">VERIFIED</span>
              </div>
              <div className="w-full bg-[#111] h-1">
                <div className="bg-[#0052FF] h-full w-[45%] relative">
                  <div className="absolute right-0 top-1/2 -translate-y-1/2 w-2 h-2 bg-white rounded-full shadow-[0_0_10px_#fff]"></div>
                </div>
              </div>

              <div className="flex justify-between text-xs font-mono pt-2">
                <span className="text-[#555]">Schema version</span>
                <span className="text-white">AQUA-1.0</span>
              </div>
              <div className="w-full bg-[#111] h-1">
                <div className="bg-white h-full w-[100%]"></div>
              </div>

              <div className="flex justify-between text-xs font-mono pt-2">
                <span className="text-[#555]">Customer data</span>
                <span className="text-[#0052FF] animate-pulse">PRIVATE</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
