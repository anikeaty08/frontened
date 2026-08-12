export default function Architecture() {
  return (
    <section
      id="how-it-works"
      className="py-40 px-6 lg:px-12 w-full relative z-10 bg-[#030303] border-t border-[#151515]"
    >
      <div className="max-w-[100rem] mx-auto grid grid-cols-1 lg:grid-cols-2 gap-20 items-center reveal">
        <div className="relative w-full aspect-square max-w-xl mx-auto flex items-center justify-center">
          {/* Abstract Technical Node Graphic built with HTML/CSS */}
          <div className="absolute inset-0 rounded-full border border-[#151515] animate-[spin_40s_linear_infinite]"></div>
          <div className="absolute inset-10 rounded-full border border-[#1A1A1A] border-dashed animate-[spin_30s_linear_infinite_reverse]"></div>
          <div className="absolute inset-20 rounded-full border border-[#222222]"></div>

          {/* Core */}
          <div className="w-24 h-24 bg-[#050505] border border-[#0052FF] rounded-full relative z-20 flex items-center justify-center shadow-[0_0_30px_rgba(0,82,255,0.2)]">
            <div className="w-8 h-8 bg-white rounded-full animate-pulse shadow-[0_0_20px_#fff]"></div>
          </div>

          {/* Nodes */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 bg-[#0052FF] rounded-full z-10 before:content-[''] before:absolute before:w-px before:h-40 before:bg-gradient-to-b before:from-[#0052FF] before:to-transparent before:left-1/2 before:top-4"></div>
          <div className="absolute bottom-10 right-10 w-3 h-3 bg-white rounded-full z-10 before:content-[''] before:absolute before:h-px before:w-32 before:bg-gradient-to-l before:from-white before:to-transparent before:right-3 before:top-1/2"></div>
          <div className="absolute top-20 left-10 w-2 h-2 bg-[#777] rounded-full z-10"></div>
        </div>

        <div className="flex flex-col items-start">
          <div className="text-[0.65rem] font-mono text-[#0052FF] uppercase tracking-widest mb-4 bg-[rgba(0,82,255,0.1)] px-3 py-1 border border-[rgba(0,82,255,0.3)]">
            Scoped Reserve Assurance
          </div>
          <h2 className="text-3xl md:text-5xl font-bold tracking-tighter text-white uppercase mb-8">
            Three Separate
            <br />
            Evidence Boundaries.
          </h2>
          <p className="text-sm md:text-base text-[#777] font-light leading-relaxed mb-8">
            AquaReserve separates private source data, public snapshot status, and authorised evidence so every participant receives only the information their role permits.
          </p>
          <div className="space-y-6 font-mono text-xs text-[#888]">
            <div className="border-l border-[#222] pl-4">
              <span className="text-white block mb-1 uppercase tracking-widest">1. Issuer publishes a snapshot</span>
              <span className="text-[#555] block mb-2">Private liabilities and reserve evidence become commitments, signatures, and a time-bound coverage result.</span>
              <span className="text-xs text-[#777] flex flex-wrap gap-x-3 gap-y-1">
                <span>// Fixed cutoff</span>
                <span>// Declared scope</span>
                <span>// Integer base units</span>
              </span>
            </div>
            <div className="border-l border-[#222] pl-4">
              <span className="text-white block mb-1 uppercase tracking-widest">2. Customers verify privately</span>
              <span className="text-[#555] block mb-2">A customer receipt proves one covered record was included without disclosing another customer or any public balance.</span>
              <span className="text-xs text-[#777] flex flex-wrap gap-x-3 gap-y-1">
                <span>// Encrypted receipt</span>
                <span>// Merkle membership</span>
                <span>// No public identity</span>
              </span>
            </div>
            <div className="border-l border-[#222] pl-4">
              <span className="text-white block mb-1 uppercase tracking-widest">3. Auditors inspect approved evidence</span>
              <span className="text-[#555] block mb-2">An authorised auditor can inspect scoped reconciliation and reserve-control evidence without widening the public disclosure.</span>
              <span className="text-xs text-[#777] flex flex-wrap gap-x-3 gap-y-1">
                <span>// Permissioned package</span>
                <span>// Attester signature</span>
                <span>// Revocation aware</span>
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
