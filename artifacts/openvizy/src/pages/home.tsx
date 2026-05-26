import { useState, useEffect } from "react";
import { Link } from "wouter";
import { ArrowRight, Download, Music2, Shield, CheckCircle2, Zap } from "lucide-react";
import { CanvasVisualizer, type TemplateStyle } from "@/components/canvas-visualizer";
import { WaveBackground } from "@/components/wave-background";
import { useListTemplates } from "@workspace/api-client-react";
import { useScrollReveal } from "@/hooks/use-scroll-reveal";

const API_BASE = import.meta.env.BASE_URL.replace(/\/$/, "").replace(/^(\/[^/]+).*$/, "$1") + "/api";

interface ShowcaseItem {
  id: number;
  title: string;
  subtitle: string | null;
  videoUrl: string;
  posterUrl: string | null;
}

/* ── Hero rotating preview ─────────────────────────── */
const PREVIEW_CYCLE: { style: TemplateStyle; color: string; name: string }[] = [
  { style: "waveform",    color: "#ec4899", name: "Waveform Classic" },
  { style: "bars",        color: "#3b82f6", name: "Bass Bars"        },
  { style: "circular",    color: "#a855f7", name: "Vinyl Circle"     },
  { style: "particles",   color: "#ec4899", name: "Particle Storm"   },
  { style: "spectrum",    color: "#3b82f6", name: "Spectrum Glow"    },
  { style: "album-float", color: "#a855f7", name: "Album Float"      },
];

const TEMPLATE_STYLES = ["waveform", "bars", "circular", "particles", "spectrum", "album-float"] as const;

const MARQUEE_ITEMS = [
  "Hip-Hop", "R&B", "Trap", "Electronic", "Drill", "Indie",
  "Jazz", "Soul", "Pop", "Lo-Fi", "Afrobeats", "Gospel",
  "Dancehall", "House", "Punk", "Classical", "Reggaeton", "Alternative",
];

export default function Home() {
  const { data: templates } = useListTemplates();
  const [previewIdx, setPreviewIdx] = useState(0);
  const [previewVisible, setPreviewVisible] = useState(true);
  const [showcase, setShowcase] = useState<ShowcaseItem[]>([]);

  useScrollReveal();

  useEffect(() => {
    fetch(`${API_BASE}/showcase`)
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => Array.isArray(data) && setShowcase(data))
      .catch(() => {});
  }, []);

  useEffect(() => {
    const id = setInterval(() => {
      setPreviewVisible(false);
      setTimeout(() => {
        setPreviewIdx((i) => (i + 1) % PREVIEW_CYCLE.length);
        setPreviewVisible(true);
      }, 350);
    }, 3200);
    return () => clearInterval(id);
  }, []);

  const preview = PREVIEW_CYCLE[previewIdx];

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">

      {/* ── Hero ──────────────────────────────────────── */}
      <section className="relative pt-36 pb-24 px-6 overflow-hidden grid-bg">
        <div className="orb orb-pink w-[560px] h-[560px] -top-48 -left-48 animate-aurora" />
        <div className="orb orb-blue  w-[640px] h-[640px] -bottom-48 -right-48 animate-aurora-b" />
        <WaveBackground className="opacity-75" />
        <div className="beam" />
        <div className="absolute inset-0 bg-gradient-to-b from-background/20 via-transparent to-background pointer-events-none" />

        <div className="relative max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">

            {/* Left — text */}
            <div>
              <p className="eyebrow">
                <span className="w-1 h-1 rounded-full bg-primary inline-block" />
                The come-up starts here.
              </p>

              <h1 className="text-5xl sm:text-6xl font-black tracking-tight leading-[1.05] mb-6">
                Music videos for the{" "}
                <span className="gradient-text-animated">next generation.</span>

              </h1>

              <p className="text-base text-muted-foreground max-w-md mb-8 leading-relaxed">
                Your music. Your visuals. No queue, no catch, no gatekeep.
              </p>

              <div className="flex flex-wrap gap-3 mb-10">
                <Link
                  href="/templates"
                  data-testid="button-browse-templates"
                  className="inline-flex items-center gap-2 bg-muted/60 hover:bg-muted border border-border text-foreground font-semibold px-7 py-3.5 rounded-xl transition-all duration-200 hover:scale-[1.02]"
                >
                  View templates
                </Link>
              </div>

              {/* Trust row */}
              <div className="flex items-center gap-5 text-xs text-muted-foreground">
                {["Export in 3 formats", "Instant download", "Cancel anytime"].map((t) => (
                  <span key={t} className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-chart-4 shrink-0" />
                    {t}
                  </span>
                ))}
              </div>
            </div>

            {/* Right — live rotating canvas preview */}
            <div className="flex items-center justify-center lg:justify-end animate-float-slow">
              <div className="relative w-full max-w-[380px]">
                {/* Outer glow */}
                <div
                  className="absolute inset-0 rounded-2xl blur-3xl opacity-40 transition-colors duration-700"
                  style={{ background: preview?.color ?? "#ec4899" }}
                />
                {/* Card */}
                <div className="relative rounded-2xl overflow-hidden border border-white/10 shadow-2xl animate-border-cycle bg-card">
                  {/* LIVE badge */}
                  <div className="absolute top-3 left-3 z-10 flex items-center gap-1.5 bg-black/60 backdrop-blur-sm px-2.5 py-1 rounded-full">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />
                    <span className="text-[10px] text-white font-semibold uppercase tracking-wider">Live Preview</span>
                  </div>
                  {/* Visualizer — crossfade via opacity */}
                  <div
                    className="transition-opacity duration-350"
                    style={{ opacity: previewVisible ? 1 : 0 }}
                  >
                    <CanvasVisualizer
                      style={preview?.style ?? "waveform"}
                      color={preview?.color ?? "#ec4899"}
                      width={480}
                      height={300}
                      className="w-full h-auto"
                    />
                  </div>
                  {/* Bottom label */}
                  <div className="px-4 py-3 bg-card/80 backdrop-blur-sm border-t border-border/50 flex items-center justify-between">
                    <span className="text-xs font-semibold text-foreground">{preview?.name}</span>
                    <div className="flex gap-1">
                      {PREVIEW_CYCLE.map((_, i) => (
                        <div
                          key={i}
                          className="w-1.5 h-1.5 rounded-full transition-all duration-300"
                          style={{ background: i === previewIdx ? (preview?.color ?? "#ec4899") : "rgba(255,255,255,0.2)" }}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Stat bar — full width below grid */}
          <div className="mt-16 pt-8 border-t border-border/40 grid grid-cols-3 max-w-md gap-6">
            {[
              { value: "6",    label: "Visual templates" },
              { value: "3",    label: "Aspect ratios"    },
              { value: "100%", label: "In-browser"         },
            ].map(({ value, label }) => (
              <div key={label} className="text-center">
                <div className="text-2xl font-black gradient-text">{value}</div>
                <div className="text-xs text-muted-foreground mt-0.5 font-medium">{label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Genre Marquee ─────────────────────────────── */}
      <div className="py-5 border-y border-border/30 bg-card/20 overflow-hidden">
        <div className="flex gap-0 whitespace-nowrap">
          <div className="marquee-track flex shrink-0 gap-8 pr-8">
            {[...MARQUEE_ITEMS, ...MARQUEE_ITEMS].map((item, i) => (
              <span key={i} className="text-[11px] font-bold uppercase tracking-[0.15em] text-muted-foreground/60 select-none">
                {item}
                <span className="ml-8 text-primary/30">·</span>
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* ── Templates ─────────────────────────────────── */}
      <section className="py-24 px-6 section-mesh">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14 reveal">
            <p className="eyebrow justify-center">Templates</p>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-3">
              Audio-reactive, live in your browser
            </h2>
            <p className="text-muted-foreground max-w-lg mx-auto text-sm">
              Every template renders in real time — no queue, no upload, no waiting.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {(templates ?? [
              { id: "waveform-classic", name: "Waveform Classic", style: "waveform",    previewColor: "#ec4899" },
              { id: "bass-bars",        name: "Bass Bars",        style: "bars",         previewColor: "#3b82f6" },
              { id: "vinyl-circle",     name: "Vinyl Circle",     style: "circular",     previewColor: "#a855f7" },
              { id: "particle-storm",   name: "Particle Storm",   style: "particles",    previewColor: "#ec4899" },
              { id: "spectrum-glow",    name: "Spectrum Glow",    style: "spectrum",     previewColor: "#3b82f6" },
              { id: "album-float",      name: "Album Float",      style: "album-float",  previewColor: "#a855f7" },
            ]).map((template, i) => (
              <Link
                key={template.id}
                href="/create"
                data-testid={`card-template-preview-${template.id}`}
                className={`group relative rounded-2xl overflow-hidden border border-border/60 card-hover-glow cursor-pointer bg-card reveal reveal-d${Math.min(i + 1, 4)}`}
              >
                <CanvasVisualizer
                  style={TEMPLATE_STYLES[i] ?? "waveform"}
                  color={template.previewColor}
                  width={400}
                  height={240}
                  className="w-full h-auto"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent" />
                <div className="absolute inset-0 bg-primary/0 group-hover:bg-primary/6 transition-colors duration-300" />
                <div className="absolute bottom-0 left-0 right-0 p-4 flex items-center justify-between">
                  <span className="text-sm font-semibold text-white">{template.name}</span>
                  <ArrowRight className="w-4 h-4 text-white opacity-0 group-hover:opacity-70 -translate-x-1 group-hover:translate-x-0 transition-all duration-200" />
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── Showcase (admin-curated) ──────────────────── */}
      {showcase.length > 0 && (
        <section className="py-24 px-6 section-mesh" data-testid="section-showcase">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-14 reveal">
              <p className="eyebrow justify-center">Showcase</p>
              <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-3">
                Real videos, made on Versality
              </h2>
              <p className="text-muted-foreground max-w-lg mx-auto text-sm">
                Hand-picked tracks from the studio — press play.
              </p>
            </div>

            <div className={`grid gap-5 ${
              showcase.length === 1 ? "grid-cols-1 max-w-md mx-auto"
              : showcase.length === 2 ? "grid-cols-1 sm:grid-cols-2"
              : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
            }`}>
              {showcase.map((s, i) => (
                <div
                  key={s.id}
                  data-testid={`card-showcase-${s.id}`}
                  className={`group relative rounded-2xl overflow-hidden border border-border/60 bg-card card-hover-glow reveal reveal-d${Math.min(i + 1, 4)}`}
                >
                  <video
                    src={s.videoUrl}
                    poster={s.posterUrl ?? undefined}
                    className="w-full aspect-square bg-black object-cover"
                    controls
                    playsInline
                    preload="metadata"
                  />
                  <div className="p-4">
                    <div className="font-semibold truncate">{s.title}</div>
                    {s.subtitle && (
                      <div className="text-xs text-muted-foreground truncate mt-0.5">{s.subtitle}</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── Features ──────────────────────────────────── */}
      <section className="py-24 px-6 border-y border-border/40 bg-card/15 relative overflow-hidden">
        <div className="orb orb-blue w-[500px] h-[300px] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-8 animate-float-slow" />

        <div className="relative max-w-5xl mx-auto">
          <div className="text-center mb-14 reveal">
            <p className="eyebrow justify-center">Why Versality</p>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">
              Built for artists, not paywalls
            </h2>
          </div>

          <div className="grid sm:grid-cols-3 gap-5">
            {[
              {
                icon: Shield,
                title: "Flat pricing",
                desc: "1 simple subscription — no per-song fees and no hidden charges. Your costs stay predictable.",
                iconColor: "text-primary",
                iconBg:    "bg-primary/10",
              },
              {
                icon: Zap,
                title: "Instant render",
                desc: "Video renders live in your browser using Web Audio API — no 24-hour wait, no upload queue.",
                iconColor: "text-accent",
                iconBg:    "bg-accent/10",
              },
              {
                icon: Download,
                title: "Export-ready",
                desc: "Download as .webm formatted for TikTok, Instagram Reels, and YouTube Shorts in one click.",
                iconColor: "text-chart-3",
                iconBg:    "bg-chart-3/10",
              },
            ].map(({ icon: Icon, title, desc, iconColor, iconBg }, i) => (
              <div
                key={title}
                className={`bg-card border border-border/60 rounded-2xl p-7 feature-card-glow relative overflow-hidden group reveal reveal-d${i + 1}`}
              >
                <div className={`absolute -top-6 -right-6 w-20 h-20 rounded-full ${iconBg} blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
                <div className={`w-9 h-9 rounded-xl ${iconBg} flex items-center justify-center mb-5`}>
                  <Icon className={`w-4.5 h-4.5 ${iconColor}`} />
                </div>
                <h3 className="font-bold text-base mb-2">{title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Comparison ────────────────────────────────── */}
      <section className="py-24 px-6 relative overflow-hidden section-mesh">
        <div className="orb orb-pink w-[400px] h-[400px] -bottom-20 -left-20 opacity-10 animate-aurora" />

        <div className="relative max-w-3xl mx-auto">
          <div className="text-center mb-14 reveal">
            <p className="eyebrow justify-center">Honest comparison</p>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-3">
              Same result. Different charges.
            </h2>
            <p className="text-muted-foreground text-sm">Just facts.</p>
          </div>

          <div className="grid grid-cols-2 gap-4 items-start">
            <div className="bg-card border border-border/60 rounded-2xl p-6 reveal reveal-left">
              <div className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-5">
                Pay-per-song services
              </div>
              {[
                ["3-min song",  "$8.99"],
                ["+ lyrics",    "+$5.00"],
                ["3 formats",   "+$18 each"],
                ["Wait time",   "~24 hrs"],
                ["Per year",    "Unlimited billing"],
              ].map(([label, value]) => (
                <div key={label} className="flex justify-between py-2.5 border-b border-border/40 last:border-0 text-sm">
                  <span className="text-muted-foreground">{label}</span>
                  <span className="text-destructive/80 font-medium">{value}</span>
                </div>
              ))}
            </div>

            <div className="bg-card border rounded-2xl p-6 relative overflow-hidden animate-border-cycle reveal reveal-right">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/4 via-transparent to-accent/4 pointer-events-none rounded-2xl" />
              <div className="relative">
                <div className="flex items-center justify-between mb-5">
                  <div className="text-xs font-bold text-primary uppercase tracking-widest">Versality</div>
                  <span className="text-[10px] font-bold bg-primary text-white px-2 py-0.5 rounded-full uppercase tracking-wide">Pro</span>
                </div>
                {[
                  ["Any length",  "$0"],
                  ["Lyrics",      "$0"],
                  ["All formats", "$0"],
                  ["Wait time",   "Instant"],
                  ["Per month",   "$15"],
                ].map(([label, value]) => (
                  <div key={label} className="flex justify-between py-2.5 border-b border-border/40 last:border-0 text-sm">
                    <span className="text-muted-foreground">{label}</span>
                    <span className="text-chart-4 font-semibold">{value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* ── Final CTA ─────────────────────────────────── */}
      <section className="py-24 px-6 border-t border-border/40 relative overflow-hidden">
        <div className="orb orb-pink w-[450px] h-[450px] -top-24 right-0 opacity-10 animate-aurora-b" />
        <div className="orb orb-blue  w-[380px] h-[380px] -bottom-20 left-0  opacity-10 animate-float-slow" />

        <div className="relative max-w-2xl mx-auto text-center reveal">
          <p className="eyebrow justify-center">The come-up starts here.</p>
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">
            Made for the hidden talent
          </h2>
          <p className="text-muted-foreground mb-8 leading-relaxed text-sm max-w-lg mx-auto">
            Versality was created by Blessed the Artist and her development team — one platform built to give upcoming artists the resources and reach they need.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center mb-8">
            <Link
              href="/signup"
              className="inline-flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 text-white font-semibold px-7 py-3.5 rounded-xl transition-all duration-200 hover:scale-[1.02] shadow-lg shadow-primary/30 shimmer-btn"
            >
              Create your account
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-5 text-xs text-muted-foreground">
            {["Export in 3 formats", "Instant download", "Cancel anytime"].map((t) => (
              <span key={t} className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-chart-4" />
                {t}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ── Footer ────────────────────────────────────── */}
      <footer className="border-t border-border/40 py-8 px-6">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-primary flex items-center justify-center">
              <Music2 className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="text-sm font-bold text-foreground">Versality</span>
          </Link>
          <p className="text-xs text-muted-foreground text-center">
            Music video generation for every independent artist.
          </p>
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <Link href="/pricing"    className="hover:text-foreground transition-colors">Pricing</Link>
            <Link href="/templates"  className="hover:text-foreground transition-colors">Templates</Link>
            <Link href="/social-kit" className="hover:text-foreground transition-colors">Social Kit</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
