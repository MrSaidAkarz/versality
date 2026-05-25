import { useState } from "react";
import { Copy, Check, Instagram, Twitter, Linkedin } from "lucide-react";

const platforms = [
  {
    id: "instagram",
    name: "Instagram",
    icon: Instagram,
    color: "from-pink-500 to-orange-400",
    border: "border-pink-500/30",
    posts: [
      {
        label: "Launch announcement",
        copy: `Your music deserves a stage. Not a $25 invoice.

Introducing Versality — a music video generator built for independent artists.

- Drop your track
- Pick a template
- Download your video

One flat rate. No per-song fees. No waiting 24 hours.

Built for the artists nobody discovered yet.

Link in bio.

#Versality #IndieArtist #MusicVideo #UndiscoveredArtist #StreetTalent #MusicMarketing #NewArtist`,
      },
      {
        label: "Artist welcome post",
        copy: `To every artist grinding with no budget — this one's for you.

We built Versality because talent shouldn't be charged $25 a song to be seen.

6 audio-reactive templates. 3 formats. Instant.
One flat monthly rate.

You make the music. We make it move.

#Versality #ForTheArtist #MusicVideo #NewArtist #MusicCreator`,
      },
    ],
  },
  {
    id: "tiktok",
    name: "TikTok",
    icon: () => (
      <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current">
        <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.27 6.27 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.69a8.18 8.18 0 0 0 4.78 1.52V6.75a4.85 4.85 0 0 1-1.01-.06z"/>
      </svg>
    ),
    color: "from-cyan-400 to-pink-500",
    border: "border-cyan-400/30",
    posts: [
      {
        label: "Hook video caption",
        copy: `POV: you just found out some apps charge $25 per song for what Versality does on a $15/mo plan

Versality. Music video generator for independent artists.
Drop the audio. Drop the art. Download the vid.

No per-song fees. Link in bio.

#MusicTok #IndieArtist #MusicVideo #NewArtist #Versality #IndependentArtist`,
      },
      {
        label: "Street talent shoutout",
        copy: `The streets are full of talent that never got a shot.

Versality was built for those artists.

6 fire templates. Bass-reactive visuals. One flat rate.
No gatekeeping. Just your music.

Tag an artist who needs this.

#StreetTalent #Versality #UndiscoveredArtists #MusicMarketing`,
      },
    ],
  },
  {
    id: "twitter",
    name: "Twitter / X",
    icon: Twitter,
    color: "from-sky-400 to-blue-600",
    border: "border-sky-400/30",
    posts: [
      {
        label: "Comparison shot",
        copy: `Some apps charge $25+ per song just to get a music video.

Versality: $15/mo for 10 renders. Same quality. In-browser. Instant.

versality.app`,
      },
      {
        label: "Mission statement",
        copy: `We built Versality because talent doesn't have a price.

Every independent artist deserves a professional music video. Not a payment form.

One flat rate. No per-song fees.

RT if you know an artist who needs this.`,
      },
      {
        label: "Feature callout",
        copy: `Versality just dropped tri-band audio visualizers.

Your video now reacts to:
- Bass to artwork pulse
- Mids to glow intensity
- Highs to particle explosions

Real audio analysis. Renders in your browser.

versality.app`,
      },
    ],
  },
  {
    id: "linkedin",
    name: "LinkedIn",
    icon: Linkedin,
    color: "from-blue-600 to-blue-800",
    border: "border-blue-600/30",
    posts: [
      {
        label: "Mission & launch",
        copy: `I'm excited to introduce Versality — a music video generator built for independent artists.

The problem: getting a professional animated music video can cost $9–$27 per song on existing platforms. For independent artists without a budget, that's simply not an option.

Our solution: Versality runs entirely in your browser using the Web Audio API and Canvas, with one flat $15/month subscription that includes 10 renders — no per-song fees, no waiting in a queue.

What it does:
- 6 audio-reactive visualizer templates
- Real-time tri-band audio analysis (Bass / Mid / High)
- Square, vertical, and horizontal export
- No watermark, no wait time

The mission is simple: every artist deserves a professional stage, not just the ones who can afford one. Inspired by the vision of artist Blessed — to open the door wide for undiscovered street talent and greet every creator with a smile.

If you know an independent artist, music producer, or creative entrepreneur who could benefit from this, please share.

#IndependentArtists #MusicTech #Versality #CreativeTools`,
      },
      {
        label: "Tech highlight",
        copy: `We built a browser-based audio visualization engine at Versality and learned a lot in the process.

The core challenge: how do you make a music video that genuinely reacts to the audio — without a server, without encoding pipelines, in real time?

The answer: Web Audio API + Canvas + MediaRecorder.

We split audio into three frequency bands using FFT:
- Bass (0–250Hz) drives artwork scale pulse
- Mids (250Hz–2kHz) drive glow and shadow intensity
- Highs (2kHz+) trigger particle burst explosions

The result: a video that literally moves with your music.

Built for the artists the world hasn't found yet.

#WebAudio #JavaScript #MusicTech #Versality`,
      },
    ],
  },
];

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button
      onClick={handleCopy}
      className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors px-2.5 py-1.5 rounded-lg hover:bg-muted"
    >
      {copied ? <Check className="w-3.5 h-3.5 text-chart-4" /> : <Copy className="w-3.5 h-3.5" />}
      {copied ? "Copied!" : "Copy"}
    </button>
  );
}

export default function SocialKit() {
  return (
    <div className="min-h-screen bg-background pt-20">
      <div className="max-w-4xl mx-auto px-6 py-16">
        <div className="mb-12">
          <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 text-primary text-xs font-semibold px-3 py-1.5 rounded-full mb-6">
            Social Media Kit
          </div>
          <h1 className="text-4xl font-black tracking-tight mb-4">
            Spread the word. <span className="gradient-text">Help an artist.</span>
          </h1>
          <p className="text-muted-foreground max-w-xl leading-relaxed">
            Ready-to-post copy for every platform. Built around Versality's artist-first mission —
            welcoming undiscovered talent with open doors and honest pricing.
          </p>
        </div>

        <div className="space-y-10">
          {platforms.map((platform) => {
            const Icon = platform.icon;
            return (
              <div key={platform.id}>
                <div className="flex items-center gap-3 mb-5">
                  <div className={`w-8 h-8 rounded-xl bg-gradient-to-br ${platform.color} flex items-center justify-center text-white`}>
                    <Icon />
                  </div>
                  <h2 className="text-xl font-bold">{platform.name}</h2>
                </div>

                <div className="space-y-4">
                  {platform.posts.map((post) => (
                    <div key={post.label} className={`bg-card border ${platform.border} rounded-2xl overflow-hidden`}>
                      <div className="flex items-center justify-between px-5 py-3 border-b border-border/50">
                        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                          {post.label}
                        </span>
                        <CopyButton text={post.copy} />
                      </div>
                      <pre className="px-5 py-4 text-sm leading-relaxed whitespace-pre-wrap font-sans text-foreground/90">
                        {post.copy}
                      </pre>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-16 bg-card border border-primary/20 rounded-2xl p-8 text-center">
          <h3 className="text-xl font-bold mb-3">The mission in one line</h3>
          <blockquote className="text-lg text-muted-foreground italic leading-relaxed max-w-lg mx-auto">
            "Open the door wide for undiscovered street talent — and greet every creator with a smile."
          </blockquote>
          <p className="text-xs text-muted-foreground mt-4">— Inspired by artist Blessed, founder vision of Versality</p>
        </div>
      </div>
    </div>
  );
}
