import { Link } from "wouter";
import { ArrowRight, Twitter, Instagram, Music2, Heart, Globe, Zap, Code2, Mic2 } from "lucide-react";

const PEOPLE = [
  {
    name: "Blessed",
    role: "Founder & Vision",
    bio: "Independent artist and the reason Versality exists. Blessed saw first-hand how paywalls stop undiscovered talent from getting seen — and decided to change that.",
    gradient: "from-primary to-accent",
    initials: "BL",
    links: { twitter: "#", instagram: "#" },
    tag: "Artist · Founder",
  },
  {
    name: "The Studio",
    role: "Engineering & design",
    bio: "A small team obsessed with making professional-quality video tooling affordable for the artists who need it most. Every template, every feature, shipped with intention.",
    gradient: "from-accent to-violet-500",
    initials: "VS",
    links: { twitter: "#" },
    tag: "Team · Versality",
  },
  {
    name: "You",
    role: "The next artist",
    bio: "Versality only matters if you use it. Drop your first track, ship your first video, and tell us what's missing — we listen.",
    gradient: "from-violet-500 to-primary",
    initials: "YO",
    links: { instagram: "#" },
    tag: "Artists · Join us",
  },
];

const TIMELINE = [
  {
    year: "The spark",
    text: "Artist Blessed realizes a music video costs $25 per song on existing platforms — a price that silences most independent artists before they even start.",
  },
  {
    year: "The question",
    text: "What if the same quality came at one flat rate? What if every artist — regardless of budget — could create a professional music video in seconds?",
  },
  {
    year: "The build",
    text: "Versality is built entirely in the browser using Web Audio API and Canvas. No servers, no encoding pipeline, no waiting 24 hours. Instant.",
  },
  {
    year: "Now",
    text: "6 audio-reactive templates, 3 export formats, real-time tri-band audio analysis — and growing. Every artist gets a stage.",
  },
];

const VALUES = [
  {
    icon: Heart,
    title: "Artist-first",
    desc: "Every decision is made through one lens: does this help artists who couldn't afford this otherwise?",
    color: "text-primary",
    bg: "bg-primary/10",
  },
  {
    icon: Code2,
    title: "Built in the browser",
    desc: "Your audio never leaves your device during render. Generation runs locally — fast, private, and dependable.",
    color: "text-accent",
    bg: "bg-accent/10",
  },
  {
    icon: Zap,
    title: "No friction",
    desc: "No account. No credit card. No install. Upload your track and download your video — that's it.",
    color: "text-chart-3",
    bg: "bg-chart-3/10",
  },
  {
    icon: Globe,
    title: "For everyone",
    desc: "Street talent, bedroom producers, SoundCloud artists — the platform is designed for creators the world hasn't found yet.",
    color: "text-chart-4",
    bg: "bg-chart-4/10",
  },
];

export default function About() {
  return (
    <div className="min-h-screen bg-background pt-20">

      {/* ── Hero ─────────────────────────────────────── */}
      <section className="relative overflow-hidden px-6 py-24">
        <div className="orb orb-pink animate-aurora" style={{ width: 600, height: 600, top: "-20%", right: "-10%", opacity: 0.12 }} />
        <div className="orb orb-blue animate-aurora" style={{ width: 500, height: 500, bottom: "-10%", left: "-8%", opacity: 0.10, animationDelay: "-5s" }} />

        <div className="relative max-w-3xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 text-primary text-xs font-semibold px-3 py-1.5 rounded-full mb-8">
            <Mic2 className="w-3 h-3" />
            Our story
          </div>

          <h1 className="text-5xl sm:text-6xl font-black tracking-tight leading-[1.05] mb-6">
            Built for the artists{" "}
            <span className="gradient-text-animated">the world hasn't found yet.</span>
          </h1>

          <p className="text-lg text-muted-foreground leading-relaxed max-w-2xl mx-auto mb-10">
            Versality started with a simple frustration: why does getting a professional music video cost $25 per song?
            We built an affordable alternative that runs entirely in your browser — instant, one flat rate, no gatekeeping.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/create"
              className="inline-flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 text-white font-semibold px-7 py-3.5 rounded-xl transition-all duration-200 hover:scale-[1.02] shadow-lg shadow-primary/30 shimmer-btn"
            >
              Start creating
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/pricing"
              className="inline-flex items-center justify-center gap-2 bg-muted/60 hover:bg-muted border border-border text-foreground font-semibold px-7 py-3.5 rounded-xl transition-all duration-200"
            >
              See pricing
            </Link>
          </div>
        </div>
      </section>

      {/* ── Origin story timeline ─────────────────────── */}
      <section className="py-20 px-6 border-t border-border/40">
        <div className="max-w-3xl mx-auto">
          <div className="mb-14 text-center">
            <p className="eyebrow justify-center">Origin</p>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">
              How it started
            </h2>
          </div>

          <div className="relative">
            {/* Vertical line */}
            <div className="absolute left-6 top-0 bottom-0 w-px bg-gradient-to-b from-primary/40 via-accent/30 to-transparent" />

            <div className="space-y-12">
              {TIMELINE.map(({ year, text }, i) => (
                <div key={i} className="flex gap-8 pl-16 relative">
                  {/* Dot */}
                  <div
                    className="absolute left-[18px] top-1 w-3.5 h-3.5 rounded-full border-2 border-primary bg-background"
                    style={{ boxShadow: "0 0 10px hsl(328 90% 63% / 0.5)" }}
                  />
                  <div>
                    <div className="text-xs font-bold text-primary uppercase tracking-widest mb-2">{year}</div>
                    <p className="text-muted-foreground leading-relaxed">{text}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Values ───────────────────────────────────── */}
      <section className="py-20 px-6 border-t border-border/40 section-mesh">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <p className="eyebrow justify-center">What we stand for</p>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">
              The values behind every line of code
            </h2>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {VALUES.map(({ icon: Icon, title, desc, color, bg }) => (
              <div key={title} className="bg-card border border-border/60 rounded-2xl p-6 feature-card-glow group">
                <div className={`w-10 h-10 rounded-xl ${bg} flex items-center justify-center mb-4`}>
                  <Icon className={`w-5 h-5 ${color}`} />
                </div>
                <h3 className="font-bold mb-2">{title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── People ───────────────────────────────────── */}
      <section className="py-20 px-6 border-t border-border/40">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <p className="eyebrow justify-center">The people</p>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-3">
              Who's behind Versality
            </h2>
            <p className="text-muted-foreground text-sm max-w-lg mx-auto">
              A founder with a mission, a small team with conviction, and an open door for every artist who needs a stage.
            </p>
          </div>

          <div className="grid sm:grid-cols-3 gap-6">
            {PEOPLE.map(({ name, role, bio, gradient, initials, links, tag }) => (
              <div
                key={name}
                className="bg-card border border-border/60 rounded-2xl p-7 flex flex-col card-hover-glow group"
              >
                {/* Avatar */}
                <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${gradient} flex items-center justify-center mb-5 text-white font-black text-xl shadow-lg`}
                  style={{ boxShadow: `0 8px 24px hsl(328 90% 63% / 0.2)` }}>
                  {initials}
                </div>

                <div className="mb-1">
                  <span className="text-xs font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded-full">{tag}</span>
                </div>
                <h3 className="text-xl font-black mt-3 mb-1">{name}</h3>
                <p className="text-sm text-primary font-semibold mb-3">{role}</p>
                <p className="text-muted-foreground text-sm leading-relaxed flex-1">{bio}</p>

                {/* Social links */}
                <div className="flex gap-2 mt-5">
                  {links.twitter && (
                    <a href={links.twitter} target="_blank" rel="noopener noreferrer"
                      className="w-8 h-8 rounded-lg bg-muted hover:bg-muted/80 flex items-center justify-center transition-colors">
                      <Twitter className="w-3.5 h-3.5 text-muted-foreground" />
                    </a>
                  )}
                  {links.instagram && (
                    <a href={links.instagram} target="_blank" rel="noopener noreferrer"
                      className="w-8 h-8 rounded-lg bg-muted hover:bg-muted/80 flex items-center justify-center transition-colors">
                      <Instagram className="w-3.5 h-3.5 text-muted-foreground" />
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Mission quote ────────────────────────────── */}
      <section className="py-20 px-6 border-t border-border/40 relative overflow-hidden">
        <div className="orb orb-pink animate-aurora-b" style={{ width: 500, height: 500, top: "-30%", left: "50%", transform: "translateX(-50%)", opacity: 0.1 }} />

        <div className="relative max-w-2xl mx-auto text-center">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center mx-auto mb-8 shadow-lg"
            style={{ boxShadow: "0 0 32px hsl(328 90% 63% / 0.35)" }}>
            <Music2 className="w-6 h-6 text-white" />
          </div>

          <blockquote className="text-2xl sm:text-3xl font-bold leading-relaxed mb-6">
            "Open the door wide for undiscovered street talent —{" "}
            <span className="gradient-text-animated">and greet every creator with a smile."</span>
          </blockquote>

          <p className="text-muted-foreground text-sm mb-10">
            — Inspired by artist Blessed, founding vision of Versality
          </p>

          <Link
            href="/create"
            className="inline-flex items-center gap-2 bg-primary hover:bg-primary/90 text-white font-semibold px-8 py-3.5 rounded-xl transition-all duration-200 hover:scale-[1.02] shadow-lg shadow-primary/30 shimmer-btn"
          >
            Make your first video
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

    </div>
  );
}
