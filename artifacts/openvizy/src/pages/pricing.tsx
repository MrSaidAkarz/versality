import { useState, useEffect } from "react";
import { Link } from "wouter";
import { Check, Zap, Infinity, Music2, CreditCard, ArrowRight, Loader2 } from "lucide-react";
import { useAuth } from "@/context/auth";

const API = import.meta.env.BASE_URL.replace(/\/$/, "").replace(/^(\/[^/]+).*$/, "$1") + "/api";

interface RenderStatus {
  plan: string;
  limit: number | null;
  used: number;
  remaining: number | null;
  blocked: boolean;
}

export default function Pricing() {
  const { user } = useAuth();
  const [renderStatus, setRenderStatus] = useState<RenderStatus | null>(null);
  const [statusLoading, setStatusLoading] = useState(false);
  const [showComingSoon, setShowComingSoon] = useState(false);

  useEffect(() => {
    if (!user) return;
    setStatusLoading(true);
    fetch(`${API}/projects/render-status`, { credentials: "include" })
      .then((r) => r.json())
      .then((data: RenderStatus) => setRenderStatus(data))
      .catch(() => {})
      .finally(() => setStatusLoading(false));
  }, [user]);

  const isPro = renderStatus?.plan === "pro";
  const rendersUsed = renderStatus?.used ?? 0;
  const freeLeft = renderStatus ? Math.max(0, (renderStatus.limit ?? 1) - rendersUsed) : 1;

  return (
    <div className="min-h-screen bg-background pt-20">
      <div className="max-w-5xl mx-auto px-6 py-16">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 text-primary text-xs font-semibold px-3 py-1.5 rounded-full mb-6">
            <Zap className="w-3 h-3" />
            Simple, honest pricing
          </div>
          <h1 className="text-5xl font-black tracking-tight mb-4">
            Simple pricing. <span className="gradient-text">No surprises.</span>
          </h1>
          <p className="text-lg text-muted-foreground max-w-xl mx-auto">
            Start with one render on us — no card needed. When you're ready to go unlimited, it's one flat rate.
          </p>
        </div>

        {/* Tier Cards */}
        <div className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto">
          {/* Starter Tier */}
          <div className="bg-card border border-border rounded-2xl p-8 flex flex-col">
            <div className="mb-6">
              <div className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Starter</div>
              <div className="text-5xl font-black mb-2">$0</div>
              <div className="text-muted-foreground text-sm">forever, no card needed</div>
            </div>

            {/* Usage indicator */}
            {user && (
              <div className="bg-muted/50 rounded-xl p-4 mb-6">
                {statusLoading ? (
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Loader2 className="w-3 h-3 animate-spin" />
                    Loading usage...
                  </div>
                ) : (
                  <>
                    <div className="flex justify-between text-xs mb-2">
                      <span className="text-muted-foreground">Renders used</span>
                      <span className={freeLeft > 0 ? "text-chart-4 font-bold" : "text-muted-foreground"}>{rendersUsed} / 1</span>
                    </div>
                    <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-chart-4 rounded-full transition-all"
                        style={{ width: `${Math.min(100, rendersUsed * 100)}%` }}
                      />
                    </div>
                    {freeLeft > 0 ? (
                      <p className="text-xs text-chart-4 mt-2 font-medium">1 render available</p>
                    ) : (
                      <p className="text-xs text-muted-foreground mt-2">Starter render used — upgrade for more</p>
                    )}
                  </>
                )}
              </div>
            )}

            <ul className="space-y-3 mb-8 flex-1">
              {[
                "1 high-quality video render",
                "All 6 visualizer templates",
                "All 3 aspect ratios",
                "In-browser, instant",
                "No watermark",
              ].map(f => (
                <li key={f} className="flex items-start gap-2.5 text-sm">
                  <Check className="w-4 h-4 text-chart-4 mt-0.5 shrink-0" />
                  <span>{f}</span>
                </li>
              ))}
            </ul>

            {user && freeLeft > 0 ? (
              <Link href="/create" className="flex items-center justify-center gap-2 bg-muted hover:bg-muted/80 text-foreground font-semibold px-6 py-3 rounded-xl transition-all">
                <Music2 className="w-4 h-4" />
                Start creating
              </Link>
            ) : user && freeLeft === 0 ? (
              <div className="flex items-center justify-center gap-2 bg-muted/50 text-muted-foreground font-semibold px-6 py-3 rounded-xl cursor-not-allowed text-sm">
                Render used
              </div>
            ) : (
              <Link href="/signup" className="flex items-center justify-center gap-2 bg-muted hover:bg-muted/80 text-foreground font-semibold px-6 py-3 rounded-xl transition-all">
                <Music2 className="w-4 h-4" />
                Get started
              </Link>
            )}
          </div>

          {/* Pro Tier */}
          <div className="bg-card border border-primary/40 rounded-2xl p-8 flex flex-col relative glow-primary">
            <div className="absolute top-4 right-4 bg-primary text-white text-xs font-bold px-2.5 py-1 rounded-full">
              MOST POPULAR
            </div>

            <div className="mb-6">
              <div className="text-sm font-semibold text-primary uppercase tracking-wider mb-3">Pro</div>
              <div className="flex items-end gap-2 mb-2">
                <span className="text-5xl font-black">$15</span>
                <span className="text-muted-foreground text-sm mb-2">/month</span>
              </div>
              <div className="text-muted-foreground text-sm">10 renders / month, everything unlocked</div>
            </div>

            <ul className="space-y-3 mb-8 flex-1">
              {[
                { label: "10 renders / month", highlight: true },
                { label: "All 6 visualizer templates" },
                { label: "All 3 aspect ratios — every time" },
                { label: "Real-time audio analysis (Bass/Mid/High)" },
                { label: "Studio controls (density, scale)" },
                { label: "Priority render queue" },
                { label: "Export history & project archive" },
                { label: "Early access to new templates" },
              ].map(({ label, highlight }) => (
                <li key={label} className="flex items-start gap-2.5 text-sm">
                  <Check className={`w-4 h-4 mt-0.5 shrink-0 ${highlight ? "text-primary" : "text-chart-4"}`} />
                  <span className={highlight ? "font-semibold text-foreground" : ""}>{label}</span>
                </li>
              ))}
            </ul>

            {isPro ? (
              <div className="flex items-center justify-center gap-2 bg-chart-4/20 text-chart-4 font-semibold px-6 py-3 rounded-xl text-sm">
                <Check className="w-4 h-4" />
                You're on Pro
              </div>
            ) : showComingSoon ? (
              <div className="bg-muted/60 border border-border rounded-xl px-5 py-4 text-center">
                <p className="text-sm font-semibold text-foreground mb-1">Payment coming soon</p>
                <p className="text-xs text-muted-foreground">
                  Stripe integration is being wired up. Check back shortly — or reach out to us directly to get Pro access.
                </p>
                <button
                  onClick={() => setShowComingSoon(false)}
                  className="mt-3 text-xs text-primary hover:underline"
                >
                  Dismiss
                </button>
              </div>
            ) : (
              <button
                onClick={() => setShowComingSoon(true)}
                className="flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 text-white font-semibold px-6 py-3 rounded-xl transition-all glow-primary"
              >
                <CreditCard className="w-4 h-4" />
                Subscribe — $15/month
                <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Versality Pro breakdown */}
        <div className="mt-16 max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold text-center mb-8">
            What's included in <span className="gradient-text">Versality Pro</span>
          </h2>
          <div className="bg-card border border-primary/30 rounded-2xl overflow-hidden">
            <div className="grid grid-cols-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground bg-muted/30 px-6 py-3">
              <span>Feature</span>
              <span className="text-right text-primary">Your cost</span>
            </div>
            {[
              ["Any length",        "$15"],
              ["Lyrics overlay",    "$15"],
              ["All formats",       "$15"],
              ["HD export add-on",  "$15"],
              ["Wait time",         "Instant"],
              ["Per year",          "$15"],
            ].map(([feat, cost]) => (
              <div key={feat} className="grid grid-cols-2 px-6 py-3.5 border-t border-border text-sm">
                <span className="text-muted-foreground">{feat}</span>
                <span className="text-right text-chart-4 font-semibold">{cost}</span>
              </div>
            ))}
          </div>
          <p className="text-center text-xs text-muted-foreground mt-3">Everything above is covered under the $15/month flat rate.</p>
        </div>

        {/* Comparison */}
        <div className="mt-20 max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold text-center mb-8">How we compare</h2>
          <div className="bg-card border border-border rounded-2xl overflow-hidden">
            <div className="grid grid-cols-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground bg-muted/30 px-6 py-3">
              <span>Feature</span>
              <span className="text-center">Pay-per-song</span>
              <span className="text-center text-primary">Versality Pro</span>
            </div>
            {[
              ["Price per song",   "$8.99–$26.97", "$0 (10/month)"],
              ["3 formats",        "$24.27 bundle", "Included"],
              ["Wait time",        "Up to 24 hours", "Instant"],
              ["Subscription",     "Tied to DK plan", "$15/mo flat"],
              ["HD export add-on", "+$15 extra",  "Included"],
              ["Renders included", "1 at a time",  "10 / month"],
            ].map(([feat, dk, us]) => (
              <div key={feat} className="grid grid-cols-3 px-6 py-3.5 border-t border-border text-sm">
                <span className="text-muted-foreground">{feat}</span>
                <span className="text-center text-destructive">{dk}</span>
                <span className="text-center text-chart-4 font-medium">{us}</span>
              </div>
            ))}
          </div>
        </div>

        {/* FAQ */}
        <div className="mt-16 max-w-2xl mx-auto">
          <h2 className="text-2xl font-bold text-center mb-8">Questions</h2>
          <div className="space-y-4">
            {[
              {
                q: "Do I need a credit card to try it?",
                a: "No. Create an account, drop your audio, pick a template, and download your first render — no card needed.",
              },
              {
                q: "What happens after my starter render?",
                a: "Upgrade to Pro for $15/month to unlock 10 renders per month. Cancel anytime.",
              },
              {
                q: "Is the render done locally or on a server?",
                a: "Your video is generated entirely in your browser using Web Audio API and Canvas — your audio is processed on your device during rendering.",
              },
              {
                q: "What format does the video export as?",
                a: ".webm (VP9), which plays natively on all major platforms and can be uploaded directly to TikTok, Instagram, YouTube, and X.",
              },
            ].map(({ q, a }) => (
              <div key={q} className="bg-card border border-border rounded-xl p-5">
                <h3 className="font-semibold mb-2">{q}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{a}</p>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="mt-16 text-center">
          <Link href="/create" className="inline-flex items-center gap-2 bg-primary hover:bg-primary/90 text-white font-semibold px-8 py-3.5 rounded-xl transition-all glow-primary">
            <Infinity className="w-4 h-4" />
            Start creating
          </Link>
          <p className="text-xs text-muted-foreground mt-3">No card to start. Just your music.</p>
        </div>
      </div>
    </div>
  );
}
