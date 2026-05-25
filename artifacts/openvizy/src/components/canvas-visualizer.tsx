import { useEffect, useRef, useCallback, forwardRef, useImperativeHandle } from "react";

export type TemplateStyle = "waveform" | "bars" | "circular" | "particles" | "spectrum" | "album-float";

export interface AudioBands {
  bass: number;
  mid: number;
  high: number;
}

interface Particle {
  x: number; y: number; vx: number; vy: number; size: number; life: number;
}

interface CanvasVisualizerProps {
  style: TemplateStyle;
  color: string;
  audioData?: AudioBands | null;
  artworkUrl?: string | null;
  width?: number;
  height?: number;
  className?: string;
  particleDensity?: number;
  baseScale?: number;
}

function hexToRgb(hex: string) {
  const r = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return r ? { r: parseInt(r[1], 16), g: parseInt(r[2], 16), b: parseInt(r[3], 16) } : { r: 139, g: 92, b: 246 };
}

function getSimBands(t: number): AudioBands {
  return {
    bass: Math.abs(Math.sin(t * 2.1)) * 0.65 + 0.2,
    mid:  Math.abs(Math.sin(t * 1.4 + 1.0)) * 0.5 + 0.25,
    high: Math.abs(Math.sin(t * 3.7 + 2.1)) * 0.4 + 0.1,
  };
}

export const CanvasVisualizer = forwardRef<HTMLCanvasElement, CanvasVisualizerProps>((
  {
    style,
    color,
    audioData,
    artworkUrl,
    width = 400,
    height = 400,
    className = "",
    particleDensity = 0.5,
    baseScale = 1.0,
  },
  externalRef,
) => {
  const canvasRef      = useRef<HTMLCanvasElement>(null);
  useImperativeHandle(externalRef, () => canvasRef.current as HTMLCanvasElement, []);
  const animFrameRef   = useRef<number>(0);
  const artImgRef      = useRef<HTMLImageElement | null>(null);
  const particlesRef   = useRef<Particle[]>([]);
  const burstRef       = useRef<Particle[]>([]);
  const prevHighRef    = useRef(0);
  const audioBandsRef  = useRef<AudioBands | null>(null);

  const rgb = hexToRgb(color);

  useEffect(() => { audioBandsRef.current = audioData ?? null; }, [audioData]);

  useEffect(() => {
    if (artworkUrl) {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.src = artworkUrl;
      img.onload = () => { artImgRef.current = img; };
    } else {
      artImgRef.current = null;
    }
  }, [artworkUrl]);

  useEffect(() => {
    const count = Math.floor(80 + particleDensity * 140);
    particlesRef.current = Array.from({ length: count }, () => ({
      x: Math.random() * width, y: Math.random() * height,
      vx: (Math.random() - 0.5) * 1.2, vy: (Math.random() - 0.5) * 1.2,
      size: Math.random() * 3 + 1, life: 1,
    }));
  }, [style, width, height, particleDensity]);

  const getFreqData = useCallback((bands: AudioBands, count: number): number[] => {
    const { bass, mid, high } = bands;
    return Array.from({ length: count }, (_, i) => {
      const n = i / count;
      if (n < 0.15) return Math.min(1, bass * (0.7 + Math.random() * 0.3));
      if (n < 0.5)  return Math.min(1, mid  * (0.6 + Math.random() * 0.4));
      return Math.min(1, high * (0.5 + Math.random() * 0.5));
    });
  }, []);

  const drawWaveform = useCallback((ctx: CanvasRenderingContext2D, t: number, w: number, h: number, b: AudioBands) => {
    ctx.fillStyle = "#0d0f17";
    ctx.fillRect(0, 0, w, h);
    if (artImgRef.current) {
      ctx.save(); ctx.globalAlpha = 0.12;
      ctx.drawImage(artImgRef.current, 0, 0, w, h);
      ctx.restore();
    }
    const grad = ctx.createLinearGradient(0, 0, w, 0);
    grad.addColorStop(0,   `rgba(${rgb.r},${rgb.g},${rgb.b},0)`);
    grad.addColorStop(0.2, `rgba(${rgb.r},${rgb.g},${rgb.b},1)`);
    grad.addColorStop(0.8, `rgba(${rgb.r},${rgb.g},${rgb.b},1)`);
    grad.addColorStop(1,   `rgba(${rgb.r},${rgb.g},${rgb.b},0)`);
    ctx.beginPath();
    ctx.strokeStyle = grad;
    ctx.lineWidth = 2 + b.bass * 2.5;
    ctx.shadowColor = color;
    ctx.shadowBlur = 8 + b.mid * 32;
    for (let x = 0; x < w; x++) {
      const p = x / w, amp = Math.sin(p * Math.PI);
      const y = h / 2
        + Math.sin(p * 12 + t * 2.5) * amp * h * (0.18 + b.bass * 0.3)
        + Math.sin(p * 5  + t * 1.5) * amp * h * (0.06 + b.mid  * 0.08);
      x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    }
    ctx.stroke();
    if (artImgRef.current) {
      const size = Math.min(w, h) * 0.18 * baseScale * (1 + b.bass * 0.28);
      ctx.save();
      ctx.beginPath(); ctx.arc(size * 0.7, size * 0.7, size * 0.5, 0, Math.PI * 2); ctx.clip();
      ctx.drawImage(artImgRef.current, size * 0.2, size * 0.2, size, size);
      ctx.restore();
    }
  }, [color, rgb, baseScale]);

  const drawBars = useCallback((ctx: CanvasRenderingContext2D, t: number, w: number, h: number, b: AudioBands) => {
    ctx.fillStyle = "#0d0f17";
    ctx.fillRect(0, 0, w, h);
    const bars = 64, barW = w / bars * 0.7, gap = w / bars * 0.3;
    const freq = getFreqData(b, bars);
    freq.forEach((amp, i) => {
      const x = i * (barW + gap) + gap / 2;
      const barH = amp * baseScale * h * 0.85;
      const y = h - barH;
      const hue = (i / bars) * 60 + 200;
      const g = ctx.createLinearGradient(0, y, 0, h);
      g.addColorStop(0, `hsla(${hue},85%,65%,1)`);
      g.addColorStop(1, `hsla(${hue+40},85%,55%,0.6)`);
      ctx.fillStyle = g;
      ctx.shadowColor = `hsl(${hue},85%,65%)`;
      ctx.shadowBlur = 6 + b.mid * 20;
      ctx.beginPath(); ctx.roundRect(x, y, barW, barH, [2,2,0,0]); ctx.fill();
    });
  }, [getFreqData, baseScale]);

  const drawCircular = useCallback((ctx: CanvasRenderingContext2D, t: number, w: number, h: number, b: AudioBands) => {
    ctx.fillStyle = "#0d0f17";
    ctx.fillRect(0, 0, w, h);
    const cx = w / 2, cy = h / 2;
    const r = Math.min(w, h) * 0.28 * baseScale;
    const freq = getFreqData(b, 64);
    freq.forEach((amp, i) => {
      const angle = (i / 64) * Math.PI * 2 - Math.PI / 2;
      const len = amp * r * 0.85;
      ctx.strokeStyle = `rgba(${rgb.r},${rgb.g},${rgb.b},${0.35 + amp * 0.65})`;
      ctx.lineWidth = 2;
      ctx.shadowColor = color;
      ctx.shadowBlur = 5 + b.mid * 22;
      ctx.beginPath();
      ctx.moveTo(cx + Math.cos(angle) * r, cy + Math.sin(angle) * r);
      ctx.lineTo(cx + Math.cos(angle) * (r + len), cy + Math.sin(angle) * (r + len));
      ctx.stroke();
    });
    const albumR = r * 0.85 * (1 + b.bass * 0.18);
    if (artImgRef.current) {
      ctx.save(); ctx.translate(cx, cy); ctx.rotate(t * 0.3);
      ctx.beginPath(); ctx.arc(0, 0, albumR, 0, Math.PI * 2); ctx.clip();
      ctx.drawImage(artImgRef.current, -albumR, -albumR, albumR * 2, albumR * 2);
      ctx.restore();
      ctx.beginPath(); ctx.arc(cx, cy, albumR * 0.15, 0, Math.PI * 2);
      ctx.fillStyle = "#0d0f17"; ctx.fill();
    } else {
      ctx.beginPath(); ctx.arc(cx, cy, albumR, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${rgb.r},${rgb.g},${rgb.b},0.1)`;
      ctx.strokeStyle = `rgba(${rgb.r},${rgb.g},${rgb.b},0.4)`;
      ctx.lineWidth = 2; ctx.fill(); ctx.stroke();
    }
  }, [color, rgb, getFreqData, baseScale]);

  const drawParticles = useCallback((ctx: CanvasRenderingContext2D, _t: number, w: number, h: number, b: AudioBands) => {
    ctx.fillStyle = "rgba(13,15,23,0.18)";
    ctx.fillRect(0, 0, w, h);

    if (b.high > 0.65 && b.high > prevHighRef.current + 0.04) {
      const cx = w / 2, cy = h / 2;
      const count = Math.floor(b.high * 10 * particleDensity);
      for (let i = 0; i < count; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 2 + Math.random() * 5;
        burstRef.current.push({
          x: cx + (Math.random() - 0.5) * w * 0.4,
          y: cy + (Math.random() - 0.5) * h * 0.4,
          vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed,
          size: 2 + Math.random() * 3, life: 1,
        });
      }
    }
    prevHighRef.current = b.high;

    burstRef.current = burstRef.current.filter(p => p.life > 0);
    burstRef.current.forEach(p => {
      p.x += p.vx; p.y += p.vy; p.vx *= 0.94; p.vy *= 0.94; p.life -= 0.05;
      ctx.beginPath(); ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255,255,255,${p.life * 0.85})`;
      ctx.shadowColor = color; ctx.shadowBlur = 10; ctx.fill();
    });

    particlesRef.current.forEach(p => {
      p.x += p.vx * (1 + b.bass * 1.8); p.y += p.vy * (1 + b.bass * 1.8);
      if (p.x < 0) p.x = w; if (p.x > w) p.x = 0;
      if (p.y < 0) p.y = h; if (p.y > h) p.y = 0;
      const size = p.size * baseScale * (1 + b.bass * 0.5);
      ctx.beginPath(); ctx.arc(p.x, p.y, size, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${rgb.r},${rgb.g},${rgb.b},${0.3 + b.mid * 0.6})`;
      ctx.shadowColor = color; ctx.shadowBlur = 4 + b.high * 12; ctx.fill();
    });
  }, [color, rgb, particleDensity, baseScale]);

  const drawSpectrum = useCallback((ctx: CanvasRenderingContext2D, _t: number, w: number, h: number, b: AudioBands) => {
    ctx.fillStyle = "#0d0f17";
    ctx.fillRect(0, 0, w, h);
    const freq = getFreqData(b, 128);
    const sliceW = w / freq.length;
    freq.forEach((amp, i) => {
      const barH = amp * baseScale * h * 0.78;
      const hue = (i / freq.length) * 180 + 200;
      const g = ctx.createLinearGradient(0, h/2 - barH/2, 0, h/2 + barH/2);
      g.addColorStop(0,   `hsla(${hue},90%,65%,0)`);
      g.addColorStop(0.5, `hsla(${hue},90%,65%,${amp})`);
      g.addColorStop(1,   `hsla(${hue},90%,65%,0)`);
      ctx.fillStyle = g;
      ctx.shadowColor = `hsl(${hue},90%,65%)`;
      ctx.shadowBlur = amp * (12 + b.mid * 28);
      ctx.fillRect(i * sliceW, h/2 - barH/2, sliceW + 1, barH);
    });
  }, [getFreqData, baseScale]);

  const drawAlbumFloat = useCallback((ctx: CanvasRenderingContext2D, t: number, w: number, h: number, b: AudioBands) => {
    ctx.fillStyle = "#0d0f17";
    ctx.fillRect(0, 0, w, h);
    const cx = w / 2, cy = h / 2;
    const size = Math.min(w, h) * 0.55 * baseScale * (1 + b.bass * 0.22);
    const float = Math.sin(t * 0.8) * 8;
    const half = size / 2;

    for (let i = 3; i >= 0; i--) {
      const gR = half + i * 22 + b.bass * 22;
      const g = ctx.createRadialGradient(cx, cy + float, 0, cx, cy + float, gR);
      g.addColorStop(0, `rgba(${rgb.r},${rgb.g},${rgb.b},${(0.12 - i * 0.025) * (0.4 + b.bass)})`);
      g.addColorStop(1, `rgba(${rgb.r},${rgb.g},${rgb.b},0)`);
      ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
    }

    ctx.save(); ctx.translate(cx, cy + float);
    if (artImgRef.current) {
      ctx.beginPath(); ctx.roundRect(-half, -half, size, size, [16]); ctx.clip();
      ctx.drawImage(artImgRef.current, -half, -half, size, size);
    } else {
      ctx.fillStyle = `rgba(${rgb.r},${rgb.g},${rgb.b},0.2)`;
      ctx.beginPath(); ctx.roundRect(-half, -half, size, size, [16]); ctx.fill();
      ctx.fillStyle = `rgba(${rgb.r},${rgb.g},${rgb.b},0.6)`;
      ctx.font = `bold ${size * 0.14}px Inter`;
      ctx.textAlign = "center"; ctx.textBaseline = "middle";
      ctx.fillText("YOUR ART", 0, 0);
    }
    ctx.restore();

    ctx.strokeStyle = `rgba(${rgb.r},${rgb.g},${rgb.b},${0.25 + b.bass * 0.65})`;
    ctx.lineWidth = 2 + b.mid * 3;
    ctx.shadowColor = color; ctx.shadowBlur = 14 + b.mid * 32;
    ctx.beginPath(); ctx.roundRect(cx - half, cy + float - half, size, size, [16]); ctx.stroke();
    ctx.shadowBlur = 0;
  }, [color, rgb, baseScale]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const start = performance.now();

    const render = (now: number) => {
      const t = (now - start) / 1000;
      const w = canvas.width, h = canvas.height;
      const bands = audioBandsRef.current ?? getSimBands(t);
      ctx.shadowBlur = 0;
      switch (style) {
        case "waveform":    drawWaveform(ctx, t, w, h, bands); break;
        case "bars":        drawBars(ctx, t, w, h, bands); break;
        case "circular":    drawCircular(ctx, t, w, h, bands); break;
        case "particles":   drawParticles(ctx, t, w, h, bands); break;
        case "spectrum":    drawSpectrum(ctx, t, w, h, bands); break;
        case "album-float": drawAlbumFloat(ctx, t, w, h, bands); break;
      }
      animFrameRef.current = requestAnimationFrame(render);
    };
    animFrameRef.current = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animFrameRef.current);
  }, [style, drawWaveform, drawBars, drawCircular, drawParticles, drawSpectrum, drawAlbumFloat]);

  return (
    <canvas ref={canvasRef} width={width} height={height} className={className} style={{ display: "block" }} />
  );
});
CanvasVisualizer.displayName = "CanvasVisualizer";
