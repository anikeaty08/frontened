import { Icon } from "@iconify/react";

export default function TrustMarquee() {
  return (
    <section className="py-6 border-y border-[#151515] bg-[#030303] relative z-10 overflow-hidden flex flex-col gap-4">
      <div className="absolute left-0 top-0 bottom-0 w-32 bg-gradient-to-r from-[#030303] to-transparent z-20 pointer-events-none"></div>
      <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-[#030303] to-transparent z-20 pointer-events-none"></div>

      <div className="flex whitespace-nowrap overflow-hidden">
        <div className="animate-[marquee_30s_linear_infinite] flex items-center gap-12 text-xs uppercase font-mono tracking-widest text-[#555555]">
          <span className="text-white">Built for</span>
          <span className="w-1 h-1 bg-[#222]"></span>
          <span className="flex items-center gap-2">
            <Icon icon="solar:buildings-2-linear" className="text-lg" /> Custodial Platforms
          </span>
          <span className="w-1 h-1 bg-[#222]"></span>
          <span className="flex items-center gap-2">
            <Icon icon="solar:shield-network-linear" className="text-lg" /> Customer Verification
          </span>
          <span className="w-1 h-1 bg-[#222]"></span>
          <span className="flex items-center gap-2">
            <Icon icon="solar:graph-up-linear" className="text-lg" /> Independent Attesters
          </span>
          <span className="w-1 h-1 bg-[#222]"></span>
          <span className="flex items-center gap-2">
            <Icon icon="solar:database-linear" className="text-lg" /> Authorised Auditors
          </span>
          <span className="w-1 h-1 bg-[#222]"></span>
          {/* Loop */}
          <span className="text-white">Built for</span>
          <span className="w-1 h-1 bg-[#222]"></span>
          <span className="flex items-center gap-2">
            <Icon icon="solar:buildings-2-linear" className="text-lg" /> Custodial Platforms
          </span>
          <span className="w-1 h-1 bg-[#222]"></span>
          <span className="flex items-center gap-2">
            <Icon icon="solar:shield-network-linear" className="text-lg" /> Customer Verification
          </span>
          <span className="w-1 h-1 bg-[#222]"></span>
          <span className="flex items-center gap-2">
            <Icon icon="solar:graph-up-linear" className="text-lg" /> Independent Attesters
          </span>
          <span className="w-1 h-1 bg-[#222]"></span>
          <span className="flex items-center gap-2">
            <Icon icon="solar:database-linear" className="text-lg" /> Authorised Auditors
          </span>
          <span className="w-1 h-1 bg-[#222]"></span>
        </div>
      </div>
    </section>
  );
}
