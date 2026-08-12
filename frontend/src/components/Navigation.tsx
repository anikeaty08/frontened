"use client";

import { useEffect, useState } from "react";
import { Icon } from "@iconify/react";
import AquaReserveLogo from "@/components/AquaReserveLogo";

export default function Navigation() {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 50) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <nav
      className={`fixed top-0 left-0 w-full z-50 transition-all duration-300 backdrop-blur-xl ${
        isScrolled
          ? "border-b border-[#151515] bg-black/80 py-3"
          : "border-b border-transparent bg-black/40 py-4"
      }`}
      id="nav"
    >
      <div className="w-full flex justify-between items-center px-6 lg:px-12">
        <a href="#" className="flex items-center gap-4 relative z-10 group">
          <AquaReserveLogo className="text-white group-hover:text-[#0052FF] transition-colors duration-500" />
          <span className="tracking-tighter text-xl font-semibold text-white uppercase leading-none hover-scramble">
            AquaReserve
          </span>
        </a>

        <div className="hidden lg:flex items-center gap-8 text-xs font-mono tracking-widest text-[#777777] uppercase">
          <a href="#platform" className="hover:text-white transition-colors flex items-center gap-2">
            <span className="text-[#0052FF] opacity-50">01</span> Snapshot
          </a>
          <a href="#how-it-works" className="hover:text-white transition-colors flex items-center gap-2">
            <span className="text-[#0052FF] opacity-50">02</span> Proof Flow
          </a>
          <a href="#features" className="hover:text-white transition-colors flex items-center gap-2">
            <span className="text-[#0052FF] opacity-50">03</span> Evidence
          </a>
          <a href="#testimonials" className="hover:text-white transition-colors flex items-center gap-2">
            <span className="text-[#0052FF] opacity-50">04</span> Roadmap
          </a>
        </div>

        <div className="flex items-center gap-6">
          <a href="#deployment" className="btn-hex px-6 py-2.5 text-xs hidden md:inline-flex">
            <span className="relative z-10">Verify Inclusion</span>
          </a>
          <button className="md:hidden text-white">
            <Icon icon="solar:hamburger-menu-linear" className="text-2xl" />
          </button>
        </div>
      </div>
    </nav>
  );
}
