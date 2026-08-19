"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";

interface Twinkle {
  x: number;
  y: number;
  age: number;
  duration: number;
  size: number;
}

function CursorCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");
    if (!canvas || !context) return;

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)");
    if (reducedMotion.matches || !finePointer.matches) return;

    const twinkles: Twinkle[] = [];
    let width = 0;
    let height = 0;
    let pixelRatio = 1;
    let animationFrame = 0;
    let previousTime = performance.now();
    let lastTrailAt = 0;

    const resize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(width * pixelRatio);
      canvas.height = Math.round(height * pixelRatio);
      context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
    };

    const accent = () =>
      document.documentElement.dataset.theme === "light"
        ? "0, 82, 255"
        : "232, 237, 243";

    const addTwinkle = (x: number, y: number) => {
      if (twinkles.length >= 20) twinkles.shift();
      twinkles.push({
        x,
        y,
        age: 0,
        duration: 480 + Math.random() * 380,
        size: 1 + Math.random() * 1.25,
      });
    };

    const onPointerMove = (event: PointerEvent) => {
      if (event.timeStamp - lastTrailAt < 46) return;
      addTwinkle(event.clientX, event.clientY);
      lastTrailAt = event.timeStamp;
    };

    const draw = (time: number) => {
      const elapsed = Math.min(time - previousTime, 40);
      previousTime = time;
      context.clearRect(0, 0, width, height);
      const color = accent();

      for (let index = twinkles.length - 1; index >= 0; index -= 1) {
        const twinkle = twinkles[index];
        twinkle.age += elapsed;
        if (twinkle.age >= twinkle.duration) {
          twinkles.splice(index, 1);
          continue;
        }

        const progress = twinkle.age / twinkle.duration;
        const alpha = Math.sin(progress * Math.PI) * 0.72;
        const radius = twinkle.size * (2 + progress * 3.4);
        context.strokeStyle = `rgba(${color}, ${alpha})`;
        context.lineWidth = 0.8;
        context.beginPath();
        context.moveTo(twinkle.x - radius, twinkle.y);
        context.lineTo(twinkle.x + radius, twinkle.y);
        context.moveTo(twinkle.x, twinkle.y - radius);
        context.lineTo(twinkle.x, twinkle.y + radius);
        context.stroke();
        context.fillStyle = `rgba(${color}, ${alpha})`;
        context.beginPath();
        context.arc(twinkle.x, twinkle.y, twinkle.size * 0.65, 0, Math.PI * 2);
        context.fill();
      }

      animationFrame = window.requestAnimationFrame(draw);
    };

    resize();
    window.addEventListener("resize", resize, { passive: true });
    window.addEventListener("pointermove", onPointerMove, { passive: true });
    animationFrame = window.requestAnimationFrame(draw);

    return () => {
      window.removeEventListener("resize", resize);
      window.removeEventListener("pointermove", onPointerMove);
      window.cancelAnimationFrame(animationFrame);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-40 h-screen w-screen"
    />
  );
}

export default function GlobalCursorTwinkles() {
  const pathname = usePathname();
  return pathname === "/" ? null : <CursorCanvas />;
}
