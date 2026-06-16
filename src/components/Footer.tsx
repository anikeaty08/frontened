export default function Footer() {
  return (
    <footer className="border-t border-[#151515] bg-black pt-20 pb-10 px-6 lg:px-12 w-full relative z-10 overflow-hidden">
      <div className="max-w-[100rem] mx-auto grid grid-cols-1 md:grid-cols-12 gap-12 items-start relative z-10 mb-20">
        <div className="md:col-span-4 flex flex-col items-start">
          <a href="#" className="flex items-center gap-4 mb-6 group">
            <svg
              width="24"
              height="24"
              viewBox="0 0 40 40"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="text-white group-hover:text-[#0052FF] transition-colors"
            >
              <path d="M20 0L40 10V30L20 40L0 30V10L20 0Z" stroke="currentColor" strokeWidth="2" />
              <circle cx="20" cy="20" r="2" fill="currentColor" />
            </svg>
            <span className="tracking-tighter text-lg font-bold text-white uppercase leading-none hover-scramble">
              APKAnalyzer
            </span>
          </a>
          <p className="text-[0.7rem] font-mono text-[#555] uppercase tracking-widest leading-relaxed max-w-xs">
            Advanced Android threat detection. Uncover hidden malware behavior, C2 infrastructure, and compile forensic reports in minutes.
          </p>
        </div>

        <div className="md:col-span-2 md:col-start-7 flex flex-col gap-3 text-xs font-mono tracking-widest uppercase text-[#555]">
          <span className="text-white mb-2">Product</span>
          <a href="#" className="hover:text-white transition-colors">
            Platform
          </a>
          <a href="#" className="hover:text-white transition-colors">
            Threat Detection
          </a>
          <a href="#" className="hover:text-white transition-colors">
            Sandbox Environment
          </a>
          <a href="#" className="hover:text-white transition-colors">
            Analysis Reports
          </a>
        </div>

        <div className="md:col-span-2 flex flex-col gap-3 text-xs font-mono tracking-widest uppercase text-[#555]">
          <span className="text-white mb-2">Resources</span>
          <a href="#" className="hover:text-white transition-colors">
            Documentation
          </a>
          <a href="#" className="hover:text-white transition-colors">
            API Access
          </a>
          <a href="#" className="hover:text-white transition-colors">
            Research Blog
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
            Security Policy
          </a>
          <a href="#" className="hover:text-white transition-colors">
            Terms
          </a>
        </div>
      </div>

      <div className="max-w-[100rem] mx-auto flex flex-col md:flex-row justify-between items-center gap-4 text-[0.65rem] font-mono uppercase tracking-widest text-[#444] border-t border-[#151515] pt-8">
        <span>© 2026 APK ANALYZER. ALL RIGHTS RESERVED.</span>
        <span>
          SYSTEM STATUS: <span className="text-[#0052FF]">NOMINAL</span>
        </span>
      </div>
    </footer>
  );
}
