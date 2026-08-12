"use client";

import React, { useState } from "react";
import { Icon } from "@iconify/react";

export default function AccessForm() {
  const [formData, setFormData] = useState({
    entity: "",
    email: "",
    protocol: "sigma",
    authorized: true,
  });
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.entity || !formData.email) return;

    // Simulate submission
    setSubmitted(true);
  };

  return (
    <section id="deployment" className="relative w-full border-t border-[#151515] bg-[#030303] z-10">
      <div className="grid grid-cols-1 lg:grid-cols-2 min-h-screen">
        {/* Left: Info & Aggressive Copy */}
        <div className="p-10 md:p-20 flex flex-col justify-center border-b lg:border-b-0 lg:border-r border-[#151515] relative overflow-hidden">
          <div className="absolute inset-0 grid-bg opacity-20 pointer-events-none"></div>
          <div className="absolute top-0 left-0 w-2 h-full bg-[#0052FF]"></div>

          <div className="relative z-10 reveal max-w-lg">
            <div className="text-[0.65rem] font-mono text-[#0052FF] uppercase tracking-widest mb-6">Integration Briefing</div>
            <h2 className="text-4xl md:text-5xl font-bold tracking-tighter mb-8 leading-[0.9] text-white uppercase">
              Start Publishing
              <br />
              Scoped Snapshots.
            </h2>

            <div className="space-y-6 text-sm text-[#777] font-light leading-relaxed">
              <p>
                Tell us how your platform reports customer liabilities and reserve evidence. We will help define an assurance flow that preserves the strict private-data boundary.
              </p>

              <div className="pt-8 mt-8 border-t border-[#1A1A1A] space-y-6 font-mono text-xs">
                <div className="flex items-start gap-4">
                  <Icon icon="solar:shield-warning-bold" className="text-[#0052FF] text-xl mt-0.5" />
                  <div>
                    <span className="text-white block mb-1 uppercase tracking-widest">Role Separation</span>
                    <span className="text-[#555]">Issuer, attester, customer, and auditor access stay independently scoped.</span>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <Icon icon="solar:document-text-bold" className="text-[#0052FF] text-xl mt-0.5" />
                  <div>
                    <span className="text-white block mb-1 uppercase tracking-widest">Privacy First</span>
                    <span className="text-[#555]">Raw liabilities and reserve evidence remain inside the custodian or prover boundary.</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Minimalist Tech Form */}
        <div className="p-10 md:p-20 bg-black flex items-center justify-center relative">
          {/* Corner decor for form area */}
          <div className="absolute top-6 right-6 w-10 h-10 border-t-2 border-r-2 border-[#222]"></div>
          <div className="absolute bottom-6 left-6 w-10 h-10 border-b-2 border-l-2 border-[#222]"></div>

          {submitted ? (
            <div className="w-full max-w-md reveal text-center space-y-6">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[rgba(0,82,255,0.1)] border border-[#0052FF] mb-4">
                <Icon icon="solar:check-circle-bold" className="text-[#0052FF] text-3xl animate-pulse" />
              </div>
              <h3 className="text-2xl font-mono uppercase text-white tracking-widest">BRIEFING REQUESTED</h3>
              <p className="text-sm text-[#777] leading-relaxed">
                Your AquaReserve integration briefing request has been prepared for:
                <br />
                <span className="text-white font-mono block mt-2 text-xs">{formData.email}</span>
              </p>
              <button onClick={() => setSubmitted(false)} className="btn-hex px-6 py-2.5 text-xs mt-4">
                <span className="relative z-10">Send Another Request</span>
              </button>
            </div>
          ) : (
            <form className="w-full max-w-md reveal" onSubmit={handleSubmit} style={{ transitionDelay: "0.2s" }}>
              <div className="space-y-10">
                <div>
                  <label className="block text-[0.65rem] text-[#777] font-mono tracking-widest uppercase mb-3">
                    Custodial Platform
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.entity}
                    onChange={(e) => setFormData((p) => ({ ...p, entity: e.target.value }))}
                    className="cyber-input text-sm py-2"
                    placeholder="Platform or organisation name"
                  />
                </div>

                <div>
                  <label className="block text-[0.65rem] text-[#777] font-mono tracking-widest uppercase mb-3">
                    Technical Contact
                  </label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData((p) => ({ ...p, email: e.target.value }))}
                    className="cyber-input text-sm py-2"
                    placeholder="team@platform.com"
                  />
                </div>

                <div>
                  <label className="block text-[0.65rem] text-[#777] font-mono tracking-widest uppercase mb-3">
                    Current Phase
                  </label>
                  <div className="relative">
                    <select
                      value={formData.protocol}
                      onChange={(e) => setFormData((p) => ({ ...p, protocol: e.target.value }))}
                      className="cyber-input text-sm py-2 appearance-none cursor-pointer bg-transparent"
                    >
                      <option value="alpha" className="bg-[#111] text-white">
                        Phase 1 — Snapshot
                      </option>
                      <option value="sigma" className="bg-[#111] text-[#0052FF]">
                        Phase 2 — Assurance
                      </option>
                      <option value="omega" className="bg-[#111] text-white">
                        Phase 3 — Platform
                      </option>
                    </select>
                    <div className="absolute right-0 top-1/2 -translate-y-1/2 pointer-events-none text-[#555] flex items-center">
                      <Icon icon="solar:alt-arrow-down-linear" className="text-lg" />
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-10 bg-[#050505] border border-[#1A1A1A] p-4 flex items-center gap-4">
                <input
                  type="checkbox"
                  id="auth-check"
                  className="cyber-check"
                  checked={formData.authorized}
                  onChange={(e) => setFormData((p) => ({ ...p, authorized: e.target.checked }))}
                />
                <label
                  htmlFor="auth-check"
                  className="text-[0.65rem] text-[#777] font-mono uppercase tracking-widest cursor-pointer select-none"
                >
                  I confirm that I am authorised to discuss this platform&apos;s reserve-assurance requirements.
                </label>
              </div>

              <div className="pt-8">
                <button
                  type="submit"
                  disabled={!formData.authorized}
                  className="btn-hex btn-hex-primary w-full py-5 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span className="relative z-10 w-full flex justify-center items-center gap-2">
                    Request Briefing <Icon icon="solar:arrow-right-linear" className="text-lg" />
                  </span>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </section>
  );
}
