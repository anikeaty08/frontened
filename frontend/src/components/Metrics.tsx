export default function Metrics() {
  return (
    <section className="py-32 relative z-10 bg-black overflow-hidden border-t border-[#151515]">
      <div className="absolute inset-0 grid-bg opacity-30"></div>

      <div className="max-w-[100rem] mx-auto px-6 grid grid-cols-1 md:grid-cols-4 gap-12 text-center reveal stagger-group relative z-10">
        <div className="stagger-item flex flex-col items-center">
          <div className="text-[0.65rem] font-mono text-[#555] uppercase tracking-widest mb-4 border border-[#222] px-3 py-1 bg-[#050505]">
            Snapshot Scope
          </div>
          <div className="text-6xl font-bold tracking-tighter text-white mb-2">
            1<span className="text-2xl text-[#0052FF] ml-1">ASSET</span>
          </div>
          <p className="text-xs text-[#777] font-mono uppercase mt-2">DUSD in native units only</p>
        </div>

        <div className="stagger-item flex flex-col items-center">
          <div className="text-[0.65rem] font-mono text-[#555] uppercase tracking-widest mb-4 border border-[#222] px-3 py-1 bg-[#050505]">
            Customer Receipts
          </div>
          <div className="text-6xl font-bold tracking-tighter text-white mb-2">
            25<span className="text-2xl text-[#0052FF] ml-1">X</span>
          </div>
          <p className="text-xs text-[#777] font-mono uppercase mt-2">Encrypted private inclusion checks</p>
        </div>

        <div className="stagger-item flex flex-col items-center">
          <div className="text-[0.65rem] font-mono text-[#555] uppercase tracking-widest mb-4 border border-[#222] px-3 py-1 bg-[#050505]">
            Public Result
          </div>
          <div className="text-6xl font-bold tracking-tighter text-white mb-2">
            ZK
            <span className="text-2xl text-[#0052FF] ml-1">PROOF</span>
          </div>
          <p className="text-xs text-[#777] font-mono uppercase mt-2">Coverage status without source data</p>
        </div>

        <div className="stagger-item flex flex-col items-center">
          <div className="text-[0.65rem] font-mono text-[#555] uppercase tracking-widest mb-4 border border-[#222] px-3 py-1 bg-[#050505]">
            Snapshot States
          </div>
          <div className="text-6xl font-bold tracking-tighter text-white mb-2">
            6<span className="text-2xl text-[#0052FF] ml-1">X</span>
          </div>
          <p className="text-xs text-[#777] font-mono uppercase mt-2">Verified, shortfall, expired, revoked, invalid, unavailable</p>
        </div>
      </div>
    </section>
  );
}
