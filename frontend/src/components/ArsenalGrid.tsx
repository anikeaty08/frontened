import { Icon } from "@iconify/react";

export default function ArsenalGrid() {
  return (
    <section className="py-32 px-6 lg:px-12 w-full relative z-10 bg-[#030303] border-t border-[#151515]">
      <div className="max-w-[100rem] mx-auto">
        <div className="mb-20 reveal max-w-2xl">
          <h2 className="text-3xl md:text-5xl font-bold tracking-tighter text-white uppercase mb-6">The Arsenal.</h2>
          <p className="text-sm md:text-base text-[#777] font-light leading-relaxed">
            Everything you need to detect, analyze, and respond to advanced Android malware threats with forensic-grade precision.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 reveal stagger-group">
          {/* Card 1 */}
          <div className="glass-panel p-8 corner-brackets group stagger-item flex flex-col hover:bg-[#080808] transition-colors duration-500">
            <Icon
              icon="solar:shield-warning-linear"
              className="text-3xl text-white mb-8 group-hover:text-[#0052FF] transition-colors"
            />
            <h3 className="text-lg font-bold text-white uppercase tracking-tight mb-3 font-mono">C2 Infrastructure</h3>
            <p className="text-sm text-[#777] font-light leading-relaxed flex-1">
              Identify hidden command-and-control servers used by malicious apps. Detect remote domains, monitor callback patterns, and track attacker command channels.
            </p>
            <div className="mt-8 pt-4 border-t border-[#1A1A1A] text-[0.65rem] font-mono text-[#555] uppercase">
              Spec: DNS & Callback Tracer
            </div>
          </div>

          {/* Card 2 */}
          <div className="glass-panel p-8 corner-brackets group stagger-item flex flex-col hover:bg-[#080808] transition-colors duration-500">
            <Icon
              icon="solar:routing-3-linear"
              className="text-3xl text-white mb-8 group-hover:text-[#0052FF] transition-colors"
            />
            <h3 className="text-lg font-bold text-white uppercase tracking-tight mb-3 font-mono">Behavioral Detection</h3>
            <p className="text-sm text-[#777] font-light leading-relaxed flex-1">
              Observe malicious runtime activities such as credential harvesting, spyware actions, system call escalations, and silent background data exfiltration.
            </p>
            <div className="mt-8 pt-4 border-t border-[#1A1A1A] text-[0.65rem] font-mono text-[#555] uppercase">
              Spec: Real-time API Monitor
            </div>
          </div>

          {/* Card 3 */}
          <div className="glass-panel p-8 corner-brackets group stagger-item flex flex-col hover:bg-[#080808] transition-colors duration-500">
            <Icon
              icon="solar:server-square-update-linear"
              className="text-3xl text-white mb-8 group-hover:text-[#0052FF] transition-colors"
            />
            <h3 className="text-lg font-bold text-white uppercase tracking-tight mb-3 font-mono">Forensic Extraction</h3>
            <p className="text-sm text-[#777] font-light leading-relaxed flex-1">
              Extract critical artifacts automatically including hardcoded URLs, obfuscated IP endpoints, domain addresses, file system modifications, and system configurations.
            </p>
            <div className="mt-8 pt-4 border-t border-[#1A1A1A] text-[0.65rem] font-mono text-[#555] uppercase">
              Spec: Automated Artifact Extractor
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
