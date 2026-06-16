"use client";

import { useEffect } from "react";
import MatrixCanvas from "@/components/MatrixCanvas";
import Navigation from "@/components/Navigation";
import Hero from "@/components/Hero";
import TrustMarquee from "@/components/TrustMarquee";
import CommandTerminal from "@/components/CommandTerminal";
import ArsenalGrid from "@/components/ArsenalGrid";
import Metrics from "@/components/Metrics";
import Architecture from "@/components/Architecture";
import Pricing from "@/components/Pricing";
import Testimonials from "@/components/Testimonials";
import AccessForm from "@/components/AccessForm";
import Footer from "@/components/Footer";

export default function Home() {
  useEffect(() => {
    // Scroll Reveal Intersection Observer
    const observerOptions = {
      root: null,
      rootMargin: "0px",
      threshold: 0.1,
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    }, observerOptions);

    // Observe all components with reveal / stagger-group
    const revealElements = document.querySelectorAll(".reveal, .stagger-group");
    revealElements.forEach((el) => observer.observe(el));

    // Stagger transition delays for child items
    const staggerGroups = document.querySelectorAll(".stagger-group");
    staggerGroups.forEach((group) => {
      const items = group.querySelectorAll(".stagger-item");
      items.forEach((item, index) => {
        (item as HTMLElement).style.transitionDelay = `${index * 150}ms`;
      });
    });

    return () => {
      revealElements.forEach((el) => observer.unobserve(el));
    };
  }, []);

  return (
    <>
      {/* Background Matrix Dot Shader */}
      <MatrixCanvas />

      {/* Main Page Layout */}
      <div className="relative min-h-screen bg-transparent">
        <Navigation />
        <main>
          <Hero />
          <TrustMarquee />
          <CommandTerminal />
          <ArsenalGrid />
          <Metrics />
          <Architecture />
          <Pricing />
          <Testimonials />
          <AccessForm />
        </main>
        <Footer />
      </div>
    </>
  );
}
