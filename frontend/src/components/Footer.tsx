import AquaReserveLogo from "@/components/AquaReserveLogo";

export default function Footer() {
  return (
    <footer className="border-t border-[#151515] bg-black pt-20 pb-10 px-6 lg:px-12 w-full relative z-10 overflow-hidden">
      <div className="max-w-[100rem] mx-auto grid grid-cols-1 md:grid-cols-12 gap-12 items-start relative z-10 mb-20">
        <div className="md:col-span-4 flex flex-col items-start">
          <a href="#" className="flex items-center gap-4 mb-6 group">
            <AquaReserveLogo size={24} className="text-white group-hover:text-[#0052FF] transition-colors" />
            <span className="tracking-tighter text-lg font-bold text-white uppercase leading-none hover-scramble">
              AquaReserve
            </span>
          </a>
          <p className="text-[0.7rem] font-mono text-[#555] uppercase tracking-widest leading-relaxed max-w-xs">
            Privacy-preserving reserve assurance for custodial digital-asset platforms. Prove coverage. Preserve privacy.
          </p>
        </div>

        <div className="md:col-span-2 md:col-start-7 flex flex-col gap-3 text-xs font-mono tracking-widest uppercase text-[#555]">
          <span className="text-white mb-2">Product</span>
          <a href="#" className="hover:text-white transition-colors">
            Platform
          </a>
          <a href="#" className="hover:text-white transition-colors">
            Public Snapshots
          </a>
          <a href="#" className="hover:text-white transition-colors">
            Customer Verification
          </a>
          <a href="#" className="hover:text-white transition-colors">
            Evidence Boundaries
          </a>
        </div>

        <div className="md:col-span-2 flex flex-col gap-3 text-xs font-mono tracking-widest uppercase text-[#555]">
          <span className="text-white mb-2">Resources</span>
          <a href="#" className="hover:text-white transition-colors">
            Documentation
          </a>
          <a href="#" className="hover:text-white transition-colors">
            Partner API
          </a>
          <a href="#" className="hover:text-white transition-colors">
            Proof Methodology
          </a>
          <a href="#" className="hover:text-white transition-colors">
            Support
          </a>
        </div>

        <div className="md:col-span-2 flex flex-col gap-3 text-xs font-mono tracking-widest uppercase text-[#555]">
          <span className="text-white mb-2">Company</span>
          <a href="#" className="hover:text-white transition-colors">
            About
          </a>
          <a href="#" className="hover:text-white transition-colors">
            Contact
          </a>
          <a href="#" className="hover:text-white transition-colors">
            Privacy Policy
          </a>
          <a href="#" className="hover:text-white transition-colors">
            Terms
          </a>
        </div>
      </div>

      <div className="max-w-[100rem] mx-auto flex flex-col md:flex-row justify-between items-center gap-4 text-[0.65rem] font-mono uppercase tracking-widest text-[#444] border-t border-[#151515] pt-8">
        <span>© 2026 AQUARESERVE. ALL RIGHTS RESERVED.</span>
        <span>
          SNAPSHOT STATUS: <span className="text-[#0052FF]">VERIFIED</span>
        </span>
      </div>
    </footer>
  );
}
