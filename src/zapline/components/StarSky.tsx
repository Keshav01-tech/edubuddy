import React, { useEffect, useRef } from 'react';

export const StarSky: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const renderStars = () => {
      const d = Math.min(window.devicePixelRatio || 1, 2);
      const w = window.innerWidth;
      const h = window.innerHeight;

      canvas.width = w * d;
      canvas.height = h * d;
      ctx.setTransform(d, 0, 0, d, 0, 0);
      ctx.clearRect(0, 0, w, h);

      // Deterministic PRNG with seed 8249 as required by brief
      let seed = 8249;
      const rand = () => {
        seed = (seed * 16807) % 2147483647;
        return (seed - 1) / 2147483646;
      };

      for (let n = 0; n < 220; n++) {
        const x = rand() * w;
        const y = rand() * h;
        const r = rand() * 0.9 + 0.15;
        ctx.fillStyle = `rgba(226,220,242,${rand() * 0.45 + 0.08})`;
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fill();
      }
    };

    renderStars();
    window.addEventListener('resize', renderStars);
    return () => window.removeEventListener('resize', renderStars);
  }, []);

  return <canvas ref={canvasRef} id="sky" aria-hidden="true" />;
};
