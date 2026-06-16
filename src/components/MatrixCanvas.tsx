"use client";

import { useEffect, useRef } from "react";

interface Spark {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
}

export default function MatrixCanvas() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let width = 0;
    let height = 0;
    const SPACING = 30; // Grid spacing
    let cols = 0;
    let rows = 0;
    let time = 0;
    const mouse = { x: -1000, y: -1000 };
    let animationFrameId: number;

    const resize = () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
      cols = Math.floor(width / SPACING) + 2;
      rows = Math.floor(height / SPACING) + 2;
    };

    window.addEventListener("resize", resize);
    resize();

    const handleMouseMove = (e: MouseEvent) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
    };
    window.addEventListener("mousemove", handleMouseMove);

    // Occasional sparks
    let sparks: Spark[] = [];
    const createSpark = () => {
      if (Math.random() > 0.95) {
        sparks.push({
          x: Math.random() > 0.5 ? 0 : width,
          y: Math.random() * height,
          vx: (Math.random() > 0.5 ? 1 : -1) * (5 + Math.random() * 5),
          vy: 0,
          life: 1,
        });
      }
    };

    const draw = () => {
      ctx.clearRect(0, 0, width, height);

      time += 0.02;
      createSpark();

      // Draw Matrix
      for (let i = 0; i < cols; i++) {
        for (let j = 0; j < rows; j++) {
          const x = i * SPACING;
          const y = j * SPACING;

          // Base Wave
          const wave = Math.sin(time + i * 0.1 + j * 0.1);

          // Mouse interaction
          const dx = x - mouse.x;
          const dy = y - mouse.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          const interaction = Math.max(0, 150 - dist) / 150; // 0 to 1

          // Shift position based on interaction
          const offsetX = interaction * 15 * (dx / (dist || 1));
          const offsetY = interaction * 15 * (dy / (dist || 1));

          const finalX = x + offsetX;
          const finalY = y + offsetY + wave * 3;

          // Calculate visual traits
          const radius = 1 + interaction * 1.5;
          let alpha = 0.1 + interaction * 0.5 + (wave + 1) * 0.05;

          // Occasionally flicker
          if (Math.random() > 0.999) alpha = 1;

          ctx.beginPath();
          ctx.arc(finalX, finalY, radius, 0, Math.PI * 2);

          if (interaction > 0.5) {
            ctx.fillStyle = `rgba(0, 82, 255, ${alpha})`;
          } else {
            ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
          }
          ctx.fill();
        }
      }

      // Draw Sparks
      for (let s = sparks.length - 1; s >= 0; s--) {
        const spark = sparks[s];
        spark.x += spark.vx;
        spark.life -= 0.01;

        ctx.beginPath();
        ctx.moveTo(spark.x, spark.y);
        ctx.lineTo(spark.x - spark.vx * 2, spark.y);
        ctx.strokeStyle = `rgba(0, 82, 255, ${spark.life})`;
        ctx.lineWidth = 2;
        ctx.stroke();

        if (spark.life <= 0 || spark.x < 0 || spark.x > width) {
          sparks.splice(s, 1);
        }
      }

      animationFrameId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      window.removeEventListener("resize", resize);
      window.removeEventListener("mousemove", handleMouseMove);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return <canvas id="interactive-matrix" ref={canvasRef} />;
}
