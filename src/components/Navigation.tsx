"use client";

import { useEffect, useState } from "react";
import { Icon } from "@iconify/react";

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
          <svg
            width="28"
            height="28"
            viewBox="0 0 40 40"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="text-white group-hover:text-[#0052FF] transition-colors duration-500"
          >
            <path d="M20 0L40 10V30L20 40L0 30V10L20 0Z" stroke="currentColor" strokeWidth="2" />
            <path d="M20 10L30 15V25L20 30L10 25V15L20 10Z" stroke="currentColor" strokeWidth="2" />
            <circle cx="20" cy="20" r="2" fill="currentColor" />
          </svg>
          <span className="tracking-tighter text-xl font-semibold text-white uppercase leading-none hover-scramble">
            Cliste
          </span>
        </a>

        <div className="hidden lg:flex items-center gap-8 text-xs font-mono tracking-widest text-[#777777] uppercase">
          <a href="#platform" className="hover:text-white transition-colors flex items-center gap-2">
            <span className="text-[#0052FF] opacity-50">01</span> Platform
          </a>
          <a href="#how-it-works" className="hover:text-white transition-colors flex items-center gap-2">
            <span className="text-[#0052FF] opacity-50">02</span> How It Works
          </a>
          <a href="#features" className="hover:text-white transition-colors flex items-center gap-2">
            <span className="text-[#0052FF] opacity-50">03</span> Features
          </a>
          <a href="#testimonials" className="hover:text-white transition-colors flex items-center gap-2">
            <span className="text-[#0052FF] opacity-50">04</span> Testimonials
          </a>
        </div>

        <div className="flex items-center gap-6">
          <a href="#deployment" className="btn-hex px-6 py-2.5 text-xs hidden md:inline-flex">
            <span className="relative z-10">Access Terminal</span>
          </a>
          <button className="md:hidden text-white">
            <Icon icon="solar:hamburger-menu-linear" className="text-2xl" />
          </button>
        </div>
      </div>
    </nav>
  );
}
