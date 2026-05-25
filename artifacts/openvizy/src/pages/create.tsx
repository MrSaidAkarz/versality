import { useState, useRef, useCallback, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/context/auth";
import { Music2, Image, ChevronRight, Check, Wand2, Download, Loader2, X, Play, Pause, SlidersHorizontal, CreditCard } from "lucide-react";
import { useListTemplates, useCreateProject, getListProjectsQueryKey, getGetProjectStatsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useUpload } from "@workspace/object-storage-web";
import { CanvasVisualizer, type TemplateStyle, type AudioBands } from "@/components/canvas-visualizer";

const API = import.meta.env.BASE_URL.replace(/\/$/, "").replace(/^(\/[^/]+).*$/, "$1") + "/api";

const RECORD_DIMS: Record<"square" | "vertical" | "horizontal", { w: number; h: number }> = {
  square: { w: 720, h: 720 },
  vertical: { w: 540, h: 960 },
  horizontal: { w: 960, h: 540 },
};

const getNextMonthLabel = () => {
  const d = new Date();
  d.setMonth(d.getMonth() + 1, 1);
  return d.toLocaleDateString("en-US", { month: "long", year: "numeric" });
};

type Step = "upload" | "template" | "format" | "generate";
const STEPS: Step[] = ["upload", "template", "format", "generate"];
const STEP_LABELS = { upload: "Upload", template: "Template", format: "Format", generate: "Generate" };

const FORMAT_OPTIONS = [
  { value: "square", label: "Square", ratio: "1 : 1", desc: "Instagram feed, Facebook", w: 1, h: 1 },
  { value: "vertical", label: "Vertical", ratio: "9 : 16", desc: "TikTok, Instagram Reels", w: 9, h: 16 },
  { value: "horizontal", label: "Horizontal", ratio: "16 : 9", desc: "YouTube, Twitter", w: 16, h: 9 },
] as const;

interface RenderStatus {
  plan: string;
  limit: number | null;
  used: number;
  remaining: number | null;
  blocked: boolean;
}

export default function Create() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { data: templates } = useListTemplates();
  const createProject = useCreateProject();

  const [step, setStep] = useState<Step>("upload");
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [artworkFile, setArtworkFile] = useState<File | null>(null);
  const [artworkUrl, setArtworkUrl] = useState<string | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<string>("waveform-classic");
  const [selectedFormat, setSelectedFormat] = useState<"square" | "vertical" | "horizontal">("square");
  const [title, setTitle] = useState("");
  const [artistName, setArtistName] = useState("");
  const [lyrics, setLyrics] = useState("");
  const [success, setSuccess] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generateError, setGenerateError] = useState<string | null>(null);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [audioData, setAudioData] = useState<AudioBands | null>(null);
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);
  const [particleDensity, setParticleDensity] = useState(0.5);
  const [baseScale, setBaseScale] = useState(1.0);
  const [renderStatus, setRenderStatus] = useState<RenderStatus | null>(null);
  const [renderStatusLoading, setRenderStatusLoading] = useState(true);

  const audioDropRef = useRef<HTMLDivElement>(null);
  const artDropRef = useRef<HTMLDivElement>(null);
  const audioInputRef = useRef<HTMLInputElement>(null);
  const artInputRef = useRef<HTMLInputElement>(null);
  const recordCanvasRef = useRef<HTMLCanvasElement>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const audioFrameRef = useRef<number>(0);
  const { uploadFile } = useUpload();

  const activeTemplate = (templates ?? []).find((t) => t.id === selectedTemplate) ?? {
    id: "waveform-classic",
    name: "Waveform Classic",
    style: "waveform",
    previewColor: "#7C3AED",
    description: "",
    supportedFormats: ["square", "vertical", "horizontal"],
    tags: [],
  };

  // Fetch server-side render status — source of truth for limits
  useEffect(() => {
    if (!user) {
      setRenderStatusLoading(false);
      return;
    }
    setRenderStatusLoading(true);
    fetch(`${API}/projects/render-status`, { credentials: "include" })
      .then((r) => r.json())
      .then((data: RenderStatus) => setRenderStatus(data))
      .catch(() => setRenderStatus(null))
      .finally(() => setRenderStatusLoading(false));
  }, [user]);

  useEffect(() => {
    if (artworkFile) {
      const url = URL.createObjectURL(artworkFile);
      setArtworkUrl(url);
      return () => URL.revokeObjectURL(url);
    }
    return undefined;
  }, [artworkFile]);

  const isBlocked = renderStatus?.blocked === true;
  const isPro = renderStatus?.plan === "pro";
  const isUnlimited = renderStatus != null && renderStatus.limit === null;

  const handleAudioDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && (file.type.includes("audio") || file.name.endsWith(".mp3") || file.name.endsWith(".wav"))) {
      setAudioFile(file);
    }
  }, []);

  const handleArtDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && file.type.includes("image")) {
      setArtworkFile(file);
    }
  }, []);

  const stepIndex = STEPS.indexOf(step);

  // Record canvas + audio together into a webm blob
  const recordVideoBlob = useCallback(async (): Promise<Blob | null> => {
    const canvas = recordCanvasRef.current;
    if (!canvas || !audioFile) return null;

    const AudioCtx: typeof AudioContext =
      (window.AudioContext as typeof AudioContext) ??
      ((window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext);
    const audioCtx = new AudioCtx();
    audioCtxRef.current = audioCtx;

    // Decode audio for both playback-to-stream and live analysis
    const arrayBuffer = await audioFile.arrayBuffer();
    const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer.slice(0));

    // Audio playback → both AnalyserNode (for visuals) and MediaStreamDestination (for recording)
    const source = audioCtx.createBufferSource();
    source.buffer = audioBuffer;

    const analyser = audioCtx.createAnalyser();
    analyser.fftSize = 1024;
    analyserRef.current = analyser;

    const destination = audioCtx.createMediaStreamDestination();

    source.connect(analyser);
    source.connect(destination);
    // also connect to speakers so user can hear preview while recording
    source.connect(audioCtx.destination);

    // Drive audioData state from analyser → react state → CanvasVisualizer
    const freqData = new Uint8Array(analyser.frequencyBinCount);
    const tickAudio = () => {
      analyser.getByteFrequencyData(freqData);
      const bin = freqData.length;
      let bass = 0, mid = 0, high = 0;
      const bassEnd = Math.floor(bin * 0.1);
      const midEnd = Math.floor(bin * 0.5);
      for (let i = 0; i < bassEnd; i++) bass += freqData[i];
      for (let i = bassEnd; i < midEnd; i++) mid += freqData[i];
      for (let i = midEnd; i < bin; i++) high += freqData[i];
      setAudioData({
        bass: bass / (bassEnd * 255) || 0,
        mid: mid / ((midEnd - bassEnd) * 255) || 0,
        high: high / ((bin - midEnd) * 255) || 0,
      });
      audioFrameRef.current = requestAnimationFrame(tickAudio);
    };

    // Some browsers create the AudioContext suspended; resume it inside the
    // user-gesture handler (this is invoked from a click).
    if (audioCtx.state === "suspended") {
      try { await audioCtx.resume(); } catch {}
    }

    // Start driving the visualizer from real audio data BEFORE recording starts.
    audioFrameRef.current = requestAnimationFrame(tickAudio);

    const videoStream = canvas.captureStream(30);
    const combinedStream = new MediaStream([
      ...videoStream.getVideoTracks(),
      ...destination.stream.getAudioTracks(),
    ]);

    // Pick a supported mime type (vp9 first, then vp8, then default)
    const mimeCandidates = ["video/webm;codecs=vp9,opus", "video/webm;codecs=vp8,opus", "video/webm"];
    const mimeType = mimeCandidates.find((m) => MediaRecorder.isTypeSupported(m)) || "video/webm";
    const recorder = new MediaRecorder(combinedStream, { mimeType });

    const chunks: BlobPart[] = [];
    recorder.ondataavailable = (e) => { if (e.data.size > 0) chunks.push(e.data); };

    return new Promise<Blob>((resolve, reject) => {
      recorder.onstop = () => resolve(new Blob(chunks, { type: "video/webm" }));
      recorder.onerror = (e) => reject(e);
      recorder.start();
      source.start(0);
      // Record the full song, capped at 3 minutes for sanity
      const durationMs = Math.min(audioBuffer.duration * 1000, 3 * 60 * 1000);
      setTimeout(() => {
        try { recorder.stop(); } catch {}
        try { source.stop(); } catch {}
        cancelAnimationFrame(audioFrameRef.current);
        try { audioCtx.close(); } catch {}
        setAudioData(null);
      }, durationMs);
    }).finally(() => {
      cancelAnimationFrame(audioFrameRef.current);
    });
  }, [audioFile]);

  const handleGenerate = async () => {
    if (!title.trim() || !audioFile || isGenerating) return;
    if (isBlocked) return;

    setIsGenerating(true);
    setGenerateError(null);
    let videoObjectPath: string | undefined;
    let localUrl: string | undefined;

    try {
      const blob = await recordVideoBlob();
      if (!blob) throw new Error("Recording produced no video");
      localUrl = URL.createObjectURL(blob);
      const safeTitle = title.trim().replace(/[^\w-]+/g, "_") || "video";
      const videoFile = new File([blob], `${safeTitle}.webm`, { type: "video/webm" });
      const result = await uploadFile(videoFile);
      if (!result?.objectPath) throw new Error("Upload did not return an object path");
      videoObjectPath = result.objectPath;
    } catch (err) {
      console.error("Recording/upload failed:", err);
      setIsGenerating(false);
      setGenerateError(`Could not generate your video: ${err instanceof Error ? err.message : "unknown error"}. Please try again.`);
      return;
    }

    createProject.mutate(
      {
        data: {
          title: title.trim(),
          artistName: artistName.trim() || undefined,
          templateId: selectedTemplate,
          format: selectedFormat,
          lyricsText: lyrics.trim() || undefined,
          videoObjectPath,
        },
      },
      {
        onSuccess: (project) => {
          setIsGenerating(false);
          setSuccess(true);
          if (localUrl) setDownloadUrl(localUrl);
          else if (project.downloadUrl) setDownloadUrl(project.downloadUrl);
          queryClient.invalidateQueries({ queryKey: getListProjectsQueryKey() });
          queryClient.invalidateQueries({ queryKey: getGetProjectStatsQueryKey() });
          // Refresh server-side render status so the counter updates
          fetch(`${API}/projects/render-status`, { credentials: "include" })
            .then((r) => r.json())
            .then((data: RenderStatus) => setRenderStatus(data))
            .catch(() => {});
        },
        onError: (err: unknown) => {
          setIsGenerating(false);
          const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
          setGenerateError(msg || "Failed to save project. Please try again.");
        },
      }
    );
  };

  if (success) {
    return (
      <div className="min-h-screen bg-background pt-20 flex items-center justify-center px-6">
        <div className="max-w-md w-full text-center">
          <div className="w-16 h-16 bg-chart-4/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <Check className="w-8 h-8 text-chart-4" />
          </div>
          <h2 className="text-3xl font-black mb-3">Video ready</h2>
          <p className="text-muted-foreground mb-8">
            Your music video has been generated and saved to your projects.
          </p>

          <div className="flex flex-col gap-3">
            {downloadUrl && (
              <a
                href={downloadUrl}
                download={`${title}.webm`}
                data-testid="button-download-video"
                className="flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 text-white font-semibold px-6 py-3 rounded-xl transition-all glow-primary"
              >
                <Download className="w-4 h-4" />
                Download video (.webm)
              </a>
            )}
            <button
              onClick={() => {
                setStep("upload");
                setSuccess(false);
                setAudioFile(null);
                setArtworkFile(null);
                setArtworkUrl(null);
                setTitle("");
                setArtistName("");
                setLyrics("");
                setDownloadUrl(null);
                setGenerateError(null);
              }}
              data-testid="button-create-another"
              className="flex items-center justify-center gap-2 bg-muted hover:bg-muted/80 text-foreground font-semibold px-6 py-3 rounded-xl transition-all"
            >
              Create another
            </button>
            <button
              onClick={() => setLocation("/projects")}
              data-testid="button-view-projects"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              View all projects
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pt-20">
      <div className="max-w-5xl mx-auto px-6 py-10">
        {/* Step indicator */}
        <div className="flex items-center gap-2 mb-10">
          {STEPS.map((s, i) => {
            const done = i < stepIndex;
            const active = s === step;
            return (
              <div key={s} className="flex items-center gap-2">
                <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                  active ? "bg-primary text-white" : done ? "bg-chart-4/15 text-chart-4" : "bg-muted text-muted-foreground"
                }`}>
                  {done ? <Check className="w-3 h-3" /> : <span>{i + 1}</span>}
                  {STEP_LABELS[s]}
                </div>
                {i < STEPS.length - 1 && (
                  <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />
                )}
              </div>
            );
          })}
        </div>

        <div className="grid lg:grid-cols-[1fr,300px] gap-8">
          {/* Main content */}
          <div>
            {/* Step 1: Upload */}
            {step === "upload" && (
              <div>
                <h2 className="text-2xl font-bold mb-6">Upload your files</h2>
                <div className="space-y-4">
                  {/* Audio drop */}
                  <div
                    ref={audioDropRef}
                    onDrop={handleAudioDrop}
                    onDragOver={(e) => e.preventDefault()}
                    onClick={() => audioInputRef.current?.click()}
                    data-testid="dropzone-audio"
                    className={`relative border-2 border-dashed rounded-2xl p-8 cursor-pointer transition-all duration-200 text-center ${
                      audioFile ? "border-primary/50 bg-primary/5" : "border-border hover:border-primary/30 hover:bg-muted/30"
                    }`}
                  >
                    <input
                      ref={audioInputRef}
                      type="file"
                      accept="audio/*,.mp3,.wav,.flac"
                      className="hidden"
                      onChange={(e) => e.target.files?.[0] && setAudioFile(e.target.files[0])}
                    />
                    {audioFile ? (
                      <div className="flex items-center justify-center gap-3">
                        <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
                          <Music2 className="w-5 h-5 text-primary" />
                        </div>
                        <div className="text-left">
                          <div className="font-semibold text-sm">{audioFile.name}</div>
                          <div className="text-xs text-muted-foreground">{(audioFile.size / 1024 / 1024).toFixed(1)} MB</div>
                        </div>
                        <button
                          onClick={(e) => { e.stopPropagation(); setAudioFile(null); }}
                          className="ml-auto text-muted-foreground hover:text-foreground"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <>
                        <Music2 className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
                        <div className="font-semibold mb-1">Drop your audio file here</div>
                        <div className="text-sm text-muted-foreground">MP3, WAV, FLAC — or click to browse</div>
                      </>
                    )}
                  </div>

                  {/* Artwork drop */}
                  <div
                    ref={artDropRef}
                    onDrop={handleArtDrop}
                    onDragOver={(e) => e.preventDefault()}
                    onClick={() => artInputRef.current?.click()}
                    data-testid="dropzone-artwork"
                    className={`relative border-2 border-dashed rounded-2xl p-8 cursor-pointer transition-all duration-200 text-center ${
                      artworkFile ? "border-primary/50 bg-primary/5" : "border-border hover:border-primary/30 hover:bg-muted/30"
                    }`}
                  >
                    <input
                      ref={artInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => e.target.files?.[0] && setArtworkFile(e.target.files[0])}
                    />
                    {artworkUrl ? (
                      <div className="flex items-center justify-center gap-3">
                        <img src={artworkUrl} alt="Album art" className="w-12 h-12 rounded-xl object-cover" />
                        <div className="text-left">
                          <div className="font-semibold text-sm">{artworkFile?.name}</div>
                          <div className="text-xs text-muted-foreground">Album artwork ready</div>
                        </div>
                        <button
                          onClick={(e) => { e.stopPropagation(); setArtworkFile(null); setArtworkUrl(null); }}
                          className="ml-auto text-muted-foreground hover:text-foreground"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <>
                        <Image className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
                        <div className="font-semibold mb-1">Drop your album artwork</div>
                        <div className="text-sm text-muted-foreground">JPG, PNG — at least 1000x1000px recommended</div>
                      </>
                    )}
                  </div>
                </div>

                <button
                  onClick={() => setStep("template")}
                  disabled={!audioFile}
                  data-testid="button-next-template"
                  className="mt-6 flex items-center gap-2 bg-primary disabled:opacity-40 disabled:cursor-not-allowed hover:bg-primary/90 text-white font-semibold px-6 py-3 rounded-xl transition-all"
                >
                  Choose template
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* Step 2: Template */}
            {step === "template" && (
              <div>
                <h2 className="text-2xl font-bold mb-6">Choose a template</h2>
                <div className="grid grid-cols-2 gap-3">
                  {(templates ?? [
                    { id: "waveform-classic", name: "Waveform Classic", style: "waveform", previewColor: "#7C3AED", description: "Clean white waveform", supportedFormats: ["square","vertical","horizontal"], tags: [] },
                    { id: "bass-bars", name: "Bass Bars", style: "bars", previewColor: "#06B6D4", description: "Colorful frequency bars", supportedFormats: ["square","vertical","horizontal"], tags: [] },
                    { id: "vinyl-circle", name: "Vinyl Circle", style: "circular", previewColor: "#F59E0B", description: "Spinning circle", supportedFormats: ["square","vertical","horizontal"], tags: [] },
                    { id: "particle-storm", name: "Particle Storm", style: "particles", previewColor: "#10B981", description: "Particle animation", supportedFormats: ["square","vertical","horizontal"], tags: [] },
                    { id: "spectrum-glow", name: "Spectrum Glow", style: "spectrum", previewColor: "#EF4444", description: "Gradient spectrum", supportedFormats: ["square","vertical","horizontal"], tags: [] },
                    { id: "album-float", name: "Album Float", style: "album-float", previewColor: "#8B5CF6", description: "Floating album art", supportedFormats: ["square","vertical","horizontal"], tags: [] },
                  ]).map((template) => {
                    const active = selectedTemplate === template.id;
                    return (
                      <button
                        key={template.id}
                        onClick={() => setSelectedTemplate(template.id)}
                        data-testid={`button-select-template-${template.id}`}
                        className={`relative rounded-2xl overflow-hidden border-2 transition-all duration-200 text-left ${
                          active ? "border-primary scale-[1.02]" : "border-border hover:border-primary/40"
                        }`}
                      >
                        <CanvasVisualizer
                          style={template.style as TemplateStyle}
                          color={template.previewColor}
                          artworkUrl={artworkUrl}
                          width={400}
                          height={220}
                          className="w-full h-auto"
                        />
                        {active && (
                          <div className="absolute top-2 right-2 w-6 h-6 bg-primary rounded-full flex items-center justify-center">
                            <Check className="w-3.5 h-3.5 text-white" />
                          </div>
                        )}
                        <div className="p-3 bg-gradient-to-t from-card">
                          <div className="font-semibold text-sm">{template.name}</div>
                        </div>
                      </button>
                    );
                  })}
                </div>

                <div className="flex gap-3 mt-6">
                  <button
                    onClick={() => setStep("upload")}
                    className="flex items-center gap-2 bg-muted hover:bg-muted/80 text-foreground font-semibold px-5 py-2.5 rounded-xl transition-all"
                  >
                    Back
                  </button>
                  <button
                    onClick={() => setStep("format")}
                    data-testid="button-next-format"
                    className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-white font-semibold px-6 py-2.5 rounded-xl transition-all"
                  >
                    Choose format
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* Step 3: Format */}
            {step === "format" && (
              <div>
                <h2 className="text-2xl font-bold mb-6">Choose output format</h2>
                <div className="grid grid-cols-3 gap-4">
                  {FORMAT_OPTIONS.map((fmt) => {
                    const active = selectedFormat === fmt.value;
                    const boxW = 80;
                    const boxH = Math.round(boxW * (fmt.h / fmt.w));

                    return (
                      <button
                        key={fmt.value}
                        onClick={() => setSelectedFormat(fmt.value)}
                        data-testid={`button-format-${fmt.value}`}
                        className={`flex flex-col items-center p-6 rounded-2xl border-2 transition-all duration-200 ${
                          active ? "border-primary bg-primary/5" : "border-border hover:border-primary/30"
                        }`}
                      >
                        <div
                          className={`mb-4 rounded border-2 ${active ? "border-primary bg-primary/20" : "border-muted-foreground/30 bg-muted"}`}
                          style={{ width: Math.min(boxW, 80), height: Math.min(boxH, 80) }}
                        />
                        <div className="font-bold text-sm">{fmt.label}</div>
                        <div className="text-xs text-primary font-medium mt-0.5">{fmt.ratio}</div>
                        <div className="text-xs text-muted-foreground mt-1 text-center">{fmt.desc}</div>
                      </button>
                    );
                  })}
                </div>

                <div className="flex gap-3 mt-6">
                  <button
                    onClick={() => setStep("template")}
                    className="flex items-center gap-2 bg-muted hover:bg-muted/80 text-foreground font-semibold px-5 py-2.5 rounded-xl transition-all"
                  >
                    Back
                  </button>
                  <button
                    onClick={() => setStep("generate")}
                    data-testid="button-next-generate"
                    className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-white font-semibold px-6 py-2.5 rounded-xl transition-all"
                  >
                    Final details
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* Step 4: Generate */}
            {step === "generate" && (
              <div>
                <h2 className="text-2xl font-bold mb-6">Final details</h2>

                {/* Render limit walls — server-authoritative */}
                {renderStatusLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                  </div>
                ) : isBlocked && renderStatus?.plan === "starter" ? (
                  <div className="bg-card border border-primary/30 rounded-2xl p-8 text-center animate-border-cycle">
                    <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Wand2 className="w-6 h-6 text-primary" />
                    </div>
                    <h3 className="text-xl font-bold mb-2">You've used your starter render</h3>
                    <p className="text-muted-foreground text-sm mb-6 max-w-sm mx-auto">
                      Upgrade to Pro for <span className="font-semibold text-foreground">$15/month</span> and get 10 renders per month, all templates, and all formats.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-3 justify-center">
                      <Link
                        href="/pricing"
                        className="inline-flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 text-white font-semibold px-6 py-3 rounded-xl transition-all glow-primary shimmer-btn"
                      >
                        <CreditCard className="w-4 h-4" />
                        Upgrade to Pro — $15/mo
                      </Link>
                      <button
                        onClick={() => setStep("format")}
                        className="inline-flex items-center justify-center gap-2 bg-muted hover:bg-muted/80 text-foreground font-semibold px-5 py-3 rounded-xl transition-all"
                      >
                        Back
                      </button>
                    </div>
                  </div>

                ) : isBlocked && renderStatus?.plan === "pro" ? (
                  <div className="bg-card border border-border rounded-2xl p-8 text-center">
                    <div className="w-12 h-12 bg-accent/10 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Download className="w-6 h-6 text-accent" />
                    </div>
                    <h3 className="text-xl font-bold mb-2">Monthly limit reached</h3>
                    <p className="text-muted-foreground text-sm mb-2 max-w-sm mx-auto">
                      You've used all <span className="font-semibold text-foreground">10 renders</span> for this month.
                      Your limit resets on <span className="font-semibold text-foreground">{getNextMonthLabel()}</span>.
                    </p>
                    <p className="text-xs text-muted-foreground mb-6">Pro · 10 renders / month</p>
                    <button
                      onClick={() => setStep("format")}
                      className="inline-flex items-center justify-center gap-2 bg-muted hover:bg-muted/80 text-foreground font-semibold px-5 py-3 rounded-xl transition-all"
                    >
                      Back
                    </button>
                  </div>

                ) : (
                  <>
                    {/* Renders remaining banner */}
                    {renderStatus && !isUnlimited && (
                      <div className={`flex items-center justify-between bg-muted/50 border rounded-xl px-4 py-3 mb-5 text-sm ${
                        (renderStatus.remaining ?? 99) <= 3
                          ? "border-primary/40 bg-primary/5"
                          : "border-border"
                      }`}>
                        <span className="text-muted-foreground">
                          {isPro ? "Renders remaining this month" : "Renders remaining"}
                        </span>
                        <span className={`font-bold tabular-nums ${
                          (renderStatus.remaining ?? 99) <= 3 ? "text-primary" : "text-foreground"
                        }`}>
                          {renderStatus.remaining} / {renderStatus.limit}
                        </span>
                      </div>
                    )}

                    {/* Error message */}
                    {generateError && (
                      <div className="flex items-start gap-2 text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 mb-4">
                        <span className="w-1.5 h-1.5 rounded-full bg-red-400 shrink-0 mt-1.5" />
                        {generateError}
                      </div>
                    )}

                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-semibold mb-1.5" htmlFor="song-title">Song title *</label>
                        <input
                          id="song-title"
                          type="text"
                          value={title}
                          onChange={(e) => setTitle(e.target.value)}
                          placeholder="e.g. Dreams of Gold"
                          data-testid="input-song-title"
                          className="w-full bg-input border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold mb-1.5" htmlFor="artist-name">Artist name</label>
                        <input
                          id="artist-name"
                          type="text"
                          value={artistName}
                          onChange={(e) => setArtistName(e.target.value)}
                          placeholder="Your artist name"
                          data-testid="input-artist-name"
                          className="w-full bg-input border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold mb-1.5" htmlFor="lyrics">Lyrics (optional)</label>
                        <textarea
                          id="lyrics"
                          value={lyrics}
                          onChange={(e) => setLyrics(e.target.value)}
                          placeholder="Paste your lyrics here..."
                          rows={5}
                          data-testid="input-lyrics"
                          className="w-full bg-input border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all resize-none"
                        />
                      </div>

                      {/* Studio controls */}
                      <div className="border border-border rounded-2xl p-4 space-y-4">
                        <button
                          type="button"
                          onClick={() => {}}
                          className="flex items-center gap-2 text-sm font-semibold text-muted-foreground w-full"
                        >
                          <SlidersHorizontal className="w-4 h-4" />
                          Studio Controls
                        </button>
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <label className="text-xs text-muted-foreground">Particle density</label>
                            <span className="text-xs font-mono tabular-nums">{Math.round(particleDensity * 100)}%</span>
                          </div>
                          <input
                            type="range" min={0} max={1} step={0.01}
                            value={particleDensity}
                            onChange={(e) => setParticleDensity(parseFloat(e.target.value))}
                            className="w-full accent-primary"
                          />
                        </div>
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <label className="text-xs text-muted-foreground">Base scale</label>
                            <span className="text-xs font-mono tabular-nums">{baseScale.toFixed(2)}x</span>
                          </div>
                          <input
                            type="range" min={0.5} max={2} step={0.05}
                            value={baseScale}
                            onChange={(e) => setBaseScale(parseFloat(e.target.value))}
                            className="w-full accent-primary"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-3 mt-6">
                      <button
                        onClick={() => setStep("format")}
                        disabled={isGenerating}
                        className="flex items-center gap-2 bg-muted hover:bg-muted/80 disabled:opacity-50 disabled:cursor-not-allowed text-foreground font-semibold px-5 py-2.5 rounded-xl transition-all"
                      >
                        Back
                      </button>
                      <button
                        onClick={handleGenerate}
                        disabled={!title.trim() || isGenerating}
                        data-testid="button-generate-video"
                        className="flex items-center gap-2 bg-primary disabled:opacity-50 disabled:cursor-not-allowed hover:bg-primary/90 text-white font-semibold px-6 py-2.5 rounded-xl transition-all glow-primary shimmer-btn"
                      >
                        {isGenerating ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            {createProject.isPending ? "Saving..." : "Recording..."}
                          </>
                        ) : (
                          <>
                            <Wand2 className="w-4 h-4" />
                            {renderStatus && !isUnlimited && renderStatus.remaining !== null
                              ? `Generate video (${renderStatus.remaining} left${isPro ? " this month" : ""})`
                              : "Generate video"}
                          </>
                        )}
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Live preview */}
          <div className="hidden lg:block">
            <div className="sticky top-24">
              <div className="text-xs font-semibold text-muted-foreground mb-3 uppercase tracking-wider">Live Preview</div>
              <div className="rounded-2xl overflow-hidden border border-border bg-card">
                <CanvasVisualizer
                  style={activeTemplate.style as TemplateStyle}
                  color={activeTemplate.previewColor}
                  artworkUrl={artworkUrl}
                  audioData={audioData}
                  width={300}
                  height={300}
                  className="w-full h-auto"
                />
              </div>
              <div className="mt-3 text-center">
                <div className="text-sm font-semibold">{activeTemplate.name}</div>
                <div className="text-xs text-muted-foreground mt-0.5">{selectedFormat} format</div>
              </div>
            </div>
          </div>
        </div>

        {/* Hidden full-resolution canvas used for recording */}
        <div style={{ position: "fixed", left: "-9999px", top: 0, pointerEvents: "none" }} aria-hidden>
          <CanvasVisualizer
            ref={recordCanvasRef}
            style={activeTemplate.style as TemplateStyle}
            color={activeTemplate.previewColor}
            artworkUrl={artworkUrl}
            audioData={audioData}
            width={RECORD_DIMS[selectedFormat].w}
            height={RECORD_DIMS[selectedFormat].h}
            particleDensity={particleDensity}
            baseScale={baseScale}
          />
        </div>
      </div>
    </div>
  );
}
