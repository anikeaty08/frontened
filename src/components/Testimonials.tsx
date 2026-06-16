import { Icon } from "@iconify/react";

interface TestimonialCard {
  quote: string;
  name: string;
  role: string;
  icon: string;
}

const TESTIMONIALS: TestimonialCard[] = [
  {
    quote: "The multi-agent analysis caught malware that our traditional scanners completely missed. The C2 communication detection is a game-changer for our security team.",
    name: "Dr. Alex Kumar",
    role: "Lead Security Researcher",
    icon: "solar:shield-keyhole-bold",
  },
  {
    quote: "We've reduced malware analysis time from 8 hours to under 15 minutes. The forensic reports are incredibly detailed and actionable.",
    name: "Jessica Martinez",
    role: "SOC Team Lead",
    icon: "solar:widget-5-bold",
  },
  {
    quote: "As a digital forensics investigator, I've tested dozens of analysis tools. This platform's ability to detect C2 communication is unmatched.",
    name: "Robert Chen",
    role: "Digital Forensics Investigator",
    icon: "solar:routing-2-bold",
  },
  {
    quote: "The dynamic analysis engine captured runtime behaviors that would have taken us days to trace manually. Exceptional accuracy and speed.",
    name: "Sofia Patel",
    role: "Malware Analyst",
    icon: "solar:cpu-bold",
  },
  {
    quote: "Before this platform, we were manually decompiling APKs. Now we get comprehensive reports in minutes with forensic evidence included.",
    name: "Marcus Thompson",
    role: "Security Analyst",
    icon: "solar:document-text-bold",
  },
];

export default function Testimonials() {
  return (
    <section
      id="testimonials"
      className="py-32 px-6 lg:px-12 w-full relative z-10 bg-[#030303] border-t border-[#151515]"
    >
      <div className="max-w-[100rem] mx-auto">
        <div className="mb-20 reveal max-w-2xl">
          <div className="text-[0.65rem] font-mono text-[#0052FF] uppercase tracking-widest mb-4 bg-[rgba(0,82,255,0.1)] px-3 py-1 border border-[rgba(0,82,255,0.3)] inline-block">
            Testimonials
          </div>
          <h2 className="text-3xl md:text-5xl font-bold tracking-tighter text-white uppercase mb-6">
            Trusted by Security Professionals
          </h2>
          <p className="text-sm md:text-base text-[#777] font-light leading-relaxed">
            Discover how security researchers, SOC teams, and forensics professionals are detecting advanced Android malware
            with confidence.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 reveal stagger-group">
          {TESTIMONIALS.map((item, index) => (
            <div
              key={index}
              className="glass-panel p-8 corner-brackets group stagger-item flex flex-col hover:bg-[#080808] transition-colors duration-500"
            >
              <div className="flex justify-between items-center mb-6 pb-4 border-b border-[#151515]">
                <Icon icon={item.icon} className="text-[#0052FF] text-xl" />
                <span className="text-[0.6rem] font-mono text-[#555] uppercase">Verified Agent Log</span>
              </div>
              <p className="text-sm text-[#888] font-light leading-relaxed flex-1 italic mb-6">
                &quot;{item.quote}&quot;
              </p>
              <div className="flex flex-col">
                <span className="text-sm font-bold text-white font-mono">{item.name}</span>
                <span className="text-xs text-[#555] uppercase tracking-widest mt-1">{item.role}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
