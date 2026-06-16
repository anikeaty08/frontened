export default function Metrics() {
  return (
    <section className="py-32 relative z-10 bg-black overflow-hidden border-t border-[#151515]">
      <div className="absolute inset-0 grid-bg opacity-30"></div>

      <div className="max-w-[100rem] mx-auto px-6 grid grid-cols-1 md:grid-cols-4 gap-12 text-center reveal stagger-group relative z-10">
        <div className="stagger-item flex flex-col items-center">
          <div className="text-[0.65rem] font-mono text-[#555] uppercase tracking-widest mb-4 border border-[#222] px-3 py-1 bg-[#050505]">
            Obfuscation Rate
          </div>
          <div className="text-6xl font-bold tracking-tighter text-white mb-2">
            95<span className="text-2xl text-[#0052FF] ml-1">%</span>
          </div>
          <p className="text-xs text-[#777] font-mono uppercase mt-2">Use obfuscation techniques</p>
        </div>

        <div className="stagger-item flex flex-col items-center">
          <div className="text-[0.65rem] font-mono text-[#555] uppercase tracking-widest mb-4 border border-[#222] px-3 py-1 bg-[#050505]">
            C2 Callbacks
          </div>
          <div className="text-6xl font-bold tracking-tighter text-white mb-2">
            70<span className="text-2xl text-[#0052FF] ml-1">%</span>
          </div>
          <p className="text-xs text-[#777] font-mono uppercase mt-2">Communicate with C2 servers</p>
        </div>

        <div className="stagger-item flex flex-col items-center">
          <div className="text-[0.65rem] font-mono text-[#555] uppercase tracking-widest mb-4 border border-[#222] px-3 py-1 bg-[#050505]">
            Analysis Speed
          </div>
          <div className="text-6xl font-bold tracking-tighter text-white mb-2">
            3x
            <span className="text-2xl text-[#0052FF] ml-1">Faster</span>
          </div>
          <p className="text-xs text-[#777] font-mono uppercase mt-2">Than manual analysis</p>
        </div>

        <div className="stagger-item flex flex-col items-center">
          <div className="text-[0.65rem] font-mono text-[#555] uppercase tracking-widest mb-4 border border-[#222] px-3 py-1 bg-[#050505]">
            Automation Level
          </div>
          <div className="text-6xl font-bold tracking-tighter text-white mb-2">
            100<span className="text-2xl text-[#0052FF] ml-1">%</span>
          </div>
          <p className="text-xs text-[#777] font-mono uppercase mt-2">Automated Investigation</p>
        </div>
      </div>
    </section>
  );
}
