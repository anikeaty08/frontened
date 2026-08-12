import { Icon } from "@iconify/react";

interface TestimonialCard {
  quote: string;
  name: string;
  role: string;
  icon: string;
}

const TESTIMONIALS: TestimonialCard[] = [
  {
    quote: "A verified snapshot is evidence within its declared scope and timestamp. It is not a claim that a platform is audited, safe, or permanently solvent.",
    name: "Verified Snapshot",
    role: "Public status language",
    icon: "solar:shield-keyhole-bold",
  },
  {
    quote: "Customer inclusion and completeness of the full liability set are separate claims. AquaReserve gives each customer a private inclusion check.",
    name: "Private Inclusion",
    role: "Customer verification",
    icon: "solar:widget-5-bold",
  },
  {
    quote: "No raw balances, customer identities, reserve-wallet structure, or customer proof witnesses are written to the public chain.",
    name: "Privacy Boundary",
    role: "Non-negotiable rule",
    icon: "solar:routing-2-bold",
  },
  {
    quote: "A correction creates a new immutable snapshot. History is never overwritten, and revocation is visible as a first-class public outcome.",
    name: "Immutable History",
    role: "Lifecycle guarantee",
    icon: "solar:cpu-bold",
  },
  {
    quote: "Every public claim maps to a cryptographic proof or signed evidence record, with expiration and stated limitations kept visible.",
    name: "Evidence Discipline",
    role: "Assurance principle",
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
            Proof Principles
          </div>
          <h2 className="text-3xl md:text-5xl font-bold tracking-tighter text-white uppercase mb-6">
            Clear claims. Clear limits.
          </h2>
          <p className="text-sm md:text-base text-[#777] font-light leading-relaxed">
            AquaReserve is designed around what a reserve snapshot can prove, what it cannot prove, and who may inspect each kind of evidence.
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
                <span className="text-[0.6rem] font-mono text-[#555] uppercase">AquaReserve Rule</span>
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
