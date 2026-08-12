"use client";

import { useEffect, useRef } from "react";

interface Twinkle {
  x: number;
  y: number;
  age: number;
  duration: number;
  size: number;
}

const GRID_SPACING = 42;
const CURSOR_RADIUS = 170;
const MAX_TWINKLES = 24;

export default function HeroTwinkle() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");
    if (!canvas || !context) return;

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)");
    const cursor = { x: -1000, y: -1000, active: false };
    const twinkles: Twinkle[] = [];
    let width = 0;
    let height = 0;
    let pixelRatio = 1;
    let animationFrame = 0;
    let previousTime = performance.now();
    let lastTrailAt = 0;

    const themeColors = () => {
      const dark = document.documentElement.dataset.theme !== "light";
      return {
        dot: dark ? "135, 145, 158" : "38, 99, 158",
        accent: dark ? "232, 237, 243" : "0, 82, 255",
      };
    };

    const resize = () => {
      const bounds = canvas.getBoundingClientRect();
      width = Math.max(1, bounds.width);
      height = Math.max(1, bounds.height);
      pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(width * pixelRatio);
      canvas.height = Math.round(height * pixelRatio);
      context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
    };

    const addTwinkle = (x: number, y: number, size = 1) => {
      if (twinkles.length >= MAX_TWINKLES) twinkles.shift();
      twinkles.push({
        x,
        y,
        age: 0,
        duration: 520 + Math.random() * 440,
        size: size * (0.8 + Math.random() * 1.2),
      });
    };

    const onPointerMove = (event: PointerEvent) => {
      if (!finePointer.matches) return;
      const bounds = canvas.getBoundingClientRect();
      cursor.x = event.clientX - bounds.left;
      cursor.y = event.clientY - bounds.top;
      cursor.active =
        cursor.x >= 0 &&
        cursor.x <= width &&
        cursor.y >= 0 &&
        cursor.y <= height;

      if (cursor.active && event.timeStamp - lastTrailAt > 42) {
        addTwinkle(cursor.x, cursor.y, 1.35);
        lastTrailAt = event.timeStamp;
      }
    };

    const onPointerLeave = () => {
      cursor.active = false;
    };

    const drawTwinkle = (twinkle: Twinkle, accent: string) => {
      const progress = twinkle.age / twinkle.duration;
      const alpha = Math.sin(progress * Math.PI) * 0.8;
      const radius = twinkle.size * (2.2 + progress * 3.6);

      context.strokeStyle = `rgba(${accent}, ${alpha})`;
      context.lineWidth = 0.8;
      context.beginPath();
      context.moveTo(twinkle.x - radius, twinkle.y);
      context.lineTo(twinkle.x + radius, twinkle.y);
      context.moveTo(twinkle.x, twinkle.y - radius);
      context.lineTo(twinkle.x, twinkle.y + radius);
      context.stroke();

      context.fillStyle = `rgba(255, 255, 255, ${alpha})`;
      context.beginPath();
      context.arc(
        twinkle.x,
        twinkle.y,
        Math.max(0.7, twinkle.size),
        0,
        Math.PI * 2,
      );
      context.fill();
    };

    const draw = (time: number) => {
      const elapsed = Math.min(time - previousTime, 40);
      previousTime = time;
      const colors = themeColors();
      context.clearRect(0, 0, width, height);

      const drift = reducedMotion.matches ? 0 : time * 0.00055;
      for (let y = GRID_SPACING / 2; y < height; y += GRID_SPACING) {
        for (let x = GRID_SPACING / 2; x < width; x += GRID_SPACING) {
          const wave = Math.sin(x * 0.018 + y * 0.012 + drift) * 1.4;
          const dx = x - cursor.x;
          const dy = y - cursor.y;
          const distance = Math.hypot(dx, dy) || 1;
          const influence = cursor.active
            ? Math.max(0, 1 - distance / CURSOR_RADIUS)
            : 0;
          const displacement = influence * influence * 10;
          const drawX = x + (dx / distance) * displacement;
          const drawY = y + wave + (dy / distance) * displacement;

          context.fillStyle = `rgba(${influence > 0.16 ? colors.accent : colors.dot}, ${0.1 + influence * 0.58})`;
          context.beginPath();
          context.arc(drawX, drawY, 0.8 + influence * 1.45, 0, Math.PI * 2);
          context.fill();
        }
      }

      if (!reducedMotion.matches && Math.random() < 0.018) {
        addTwinkle(Math.random() * width, Math.random() * height, 0.75);
      }

      for (let index = twinkles.length - 1; index >= 0; index -= 1) {
        const twinkle = twinkles[index];
        twinkle.age += elapsed;
        if (twinkle.age >= twinkle.duration || reducedMotion.matches) {
          twinkles.splice(index, 1);
          continue;
        }
        drawTwinkle(twinkle, colors.accent);
      }

      animationFrame = window.requestAnimationFrame(draw);
    };

    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(canvas);
    window.addEventListener("pointermove", onPointerMove, { passive: true });
    window.addEventListener("blur", onPointerLeave);
    document.addEventListener("pointerleave", onPointerLeave);
    resize();
    animationFrame = window.requestAnimationFrame(draw);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("blur", onPointerLeave);
      document.removeEventListener("pointerleave", onPointerLeave);
      window.cancelAnimationFrame(animationFrame);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 h-full w-full opacity-75 [mask-image:linear-gradient(to_bottom,black,transparent_92%)]"
    />
  );
}
