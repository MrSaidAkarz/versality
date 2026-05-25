import { useEffect, useRef } from "react";

interface Wave {
  amplitude: number;
  frequency: number;
  speed: number;
  rgb: string;
  opacity: number;
  width: number;
  yRatio: number;
  phaseOffset: number;
}

const WAVES: Wave[] = [
  { amplitude: 20, frequency: 0.007, speed: 0.010, rgb: "236,72,153", opacity: 0.12, width: 1.5, yRatio: 0.48, phaseOffset: 0 },
  { amplitude: 14, frequency: 0.011, speed: 0.016, rgb: "59,130,246",  opacity: 0.10, width: 1.5, yRatio: 0.52, phaseOffset: 1.2 },
  { amplitude: 26, frequency: 0.005, speed: 0.007, rgb: "236,72,153", opacity: 0.06, width: 1.0, yRatio: 0.44, phaseOffset: 2.4 },
  { amplitude: 16, frequency: 0.014, speed: 0.020, rgb: "59,130,246",  opacity: 0.07, width: 1.0, yRatio: 0.56, phaseOffset: 3.8 },
  { amplitude: 10, frequency: 0.019, speed: 0.025, rgb: "200,80,220",  opacity: 0.06, width: 1.0, yRatio: 0.50, phaseOffset: 0.7 },
];

export function WaveBackground({ className = "" }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef    = useRef<number>(0);
  const phases    = useRef<number[]>(WAVES.map((w) => w.phaseOffset));

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      canvas.width  = canvas.offsetWidth  * dpr;
      canvas.height = canvas.offsetHeight * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();

    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    const draw = () => {
      const w = canvas.offsetWidth;
      const h = canvas.offsetHeight;
      ctx.clearRect(0, 0, w, h);

      WAVES.forEach((wave, i) => {
        phases.current[i] += wave.speed;
        const phase = phases.current[i];
        const midY  = h * wave.yRatio;

        ctx.beginPath();
        ctx.strokeStyle = `rgba(${wave.rgb},${wave.opacity})`;
        ctx.lineWidth   = wave.width;
        ctx.lineJoin    = "round";
        ctx.lineCap     = "round";

        for (let x = 0; x <= w + 2; x += 3) {
          const y = midY + Math.sin(x * wave.frequency + phase) * wave.amplitude;
          x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
        }
        ctx.stroke();
      });

      rafRef.current = requestAnimationFrame(draw);
    };

    rafRef.current = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(rafRef.current);
      ro.disconnect();
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className={`absolute inset-0 w-full h-full pointer-events-none ${className}`}
    />
  );
}
