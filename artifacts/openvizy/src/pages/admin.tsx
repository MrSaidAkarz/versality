import { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import {
  BarChart2, LogOut, Trash2, RefreshCw, Lock, User, TrendingUp, Video, Clock, CheckCircle,
  Upload, Sparkles, Film, Plus, Replace, X,
} from "lucide-react";

const API = import.meta.env.BASE_URL.replace(/\/$/, "").replace(/^(\/[^/]+).*$/, "$1") + "/api";

interface Stats {
  total: number;
  ready: number;
  processing: number;
  dailyCounts: { date: string; count: number }[];
  recentProjects: {
    id: number;
    title: string;
    artistName: string | null;
    templateId: string;
    format: string;
    status: string;
    createdAt: string;
    videoObjectPath: string | null;
  }[];
}

interface ShowcaseItem {
  id: number;
  title: string;
  subtitle: string | null;
  videoObjectPath: string;
  posterObjectPath: string | null;
  position: number;
  createdAt: string;
}

type Tab = "dashboard" | "upload" | "showcase";

const FORMATS = ["square", "vertical", "horizontal"] as const;
type Format = (typeof FORMATS)[number];

// ── Shared upload helper ─────────────────────────────────────────────────────
async function adminUploadFile(file: File): Promise<string> {
  const r = await fetch(`${API}/admin/storage/uploads/request-url`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({}),
  });
  if (!r.ok) throw new Error("Could not get upload URL");
  const { uploadURL, objectPath } = await r.json() as { uploadURL: string; objectPath: string };

  const put = await fetch(uploadURL, {
    method: "PUT",
    body: file,
    headers: { "Content-Type": file.type || "application/octet-stream" },
  });
  if (!put.ok) throw new Error(`Upload failed (${put.status})`);
  return objectPath;
}

export default function AdminPage() {
  const [, navigate] = useLocation();
  const [authChecked, setAuthChecked] = useState(false);
  const [authed, setAuthed] = useState(false);
  const [username, setUsername] = useState("");
  const [tab, setTab] = useState<Tab>("dashboard");

  const [loginUser, setLoginUser] = useState("");
  const [loginPass, setLoginPass] = useState("");
  const [loginError, setLoginError] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);

  const [stats, setStats] = useState<Stats | null>(null);
  const [statsLoading, setStatsLoading] = useState(false);

  const [showcase, setShowcase] = useState<ShowcaseItem[]>([]);
  const [showcaseLoading, setShowcaseLoading] = useState(false);

  const [replaceTarget, setReplaceTarget] = useState<Stats["recentProjects"][number] | null>(null);

  useEffect(() => {
    fetch(`${API}/admin/me`, { credentials: "include" })
      .then((r) => r.json())
      .then((d) => {
        if (d.authenticated) {
          setAuthed(true);
          setUsername(d.username);
        }
        setAuthChecked(true);
      })
      .catch(() => setAuthChecked(true));
  }, []);

  useEffect(() => {
    if (!authed) return;
    loadStats();
    loadShowcase();
  }, [authed]);

  const loadStats = async () => {
    setStatsLoading(true);
    try {
      const r = await fetch(`${API}/admin/stats`, { credentials: "include" });
      if (r.ok) setStats(await r.json());
    } finally {
      setStatsLoading(false);
    }
  };

  const loadShowcase = async () => {
    setShowcaseLoading(true);
    try {
      const r = await fetch(`${API}/admin/showcase`, { credentials: "include" });
      if (r.ok) setShowcase(await r.json());
    } finally {
      setShowcaseLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError("");
    setLoginLoading(true);
    try {
      const r = await fetch(`${API}/admin/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email: loginUser, password: loginPass }),
      });
      const d = await r.json();
      if (r.ok) {
        setAuthed(true);
        setUsername(d.username);
      } else {
        setLoginError(d.error || "Invalid credentials");
      }
    } catch {
      setLoginError("Network error — try again");
    } finally {
      setLoginLoading(false);
    }
  };

  const handleLogout = async () => {
    await fetch(`${API}/admin/logout`, { method: "POST", credentials: "include" });
    setAuthed(false);
    setStats(null);
    setShowcase([]);
    setUsername("");
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this project?")) return;
    await fetch(`${API}/admin/projects/${id}`, { method: "DELETE", credentials: "include" });
    loadStats();
  };

  if (!authChecked) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <RefreshCw className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // ── Login ──────────────────────────────────────────────────────────────────
  if (!authed) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden">
        <div className="orb orb-pink animate-aurora" style={{ width: 480, height: 480, top: "-15%", left: "-10%", opacity: 0.18 }} />
        <div className="orb orb-blue animate-aurora" style={{ width: 400, height: 400, bottom: "-10%", right: "-8%", opacity: 0.15, animationDelay: "-4s" }} />

        <div className="w-full max-w-sm relative z-10">
          <div className="flex flex-col items-center mb-8">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center mb-4 shadow-lg" style={{ boxShadow: "0 0 32px hsl(328 90% 63% / 0.35)" }}>
              <Lock className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-2xl font-black gradient-text-animated">Versality Admin</h1>
            <p className="text-muted-foreground text-sm mt-1">Super admin panel</p>
          </div>

          <div className="relative rounded-2xl p-px bg-gradient-to-br from-primary/30 via-border to-accent/20">
            <div className="bg-card rounded-2xl p-8">
              <form onSubmit={handleLogin} className="space-y-5">
                <div>
                  <label className="block text-sm font-semibold mb-2" htmlFor="admin-user">Email</label>
                  <div className="relative">
                    <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input
                      id="admin-user"
                      type="email"
                      autoComplete="email"
                      value={loginUser}
                      onChange={(e) => setLoginUser(e.target.value)}
                      className="w-full bg-background border border-border rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/50 transition-all"
                      placeholder="admin@admin.com"
                      required
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-2" htmlFor="admin-pass">Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input
                      id="admin-pass"
                      type="password"
                      autoComplete="current-password"
                      value={loginPass}
                      onChange={(e) => setLoginPass(e.target.value)}
                      className="w-full bg-background border border-border rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/50 transition-all"
                      placeholder="••••••••"
                      required
                    />
                  </div>
                </div>

                {loginError && (
                  <div className="flex items-center gap-2 text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-400 shrink-0" />
                    {loginError}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loginLoading}
                  className="w-full shimmer-btn bg-primary hover:bg-primary/90 text-white font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed mt-2"
                  style={{ boxShadow: loginLoading ? "none" : "0 0 20px hsl(328 90% 63% / 0.4)" }}
                >
                  {loginLoading
                    ? <><RefreshCw className="w-4 h-4 animate-spin" /> Signing in...</>
                    : <><Lock className="w-4 h-4" /> Sign in</>}
                </button>
              </form>
            </div>
          </div>

          <p className="text-center text-xs text-muted-foreground mt-5">
            This page is not publicly linked — keep the URL private.
          </p>
        </div>
      </div>
    );
  }

  // ── Dashboard shell ────────────────────────────────────────────────────────
  const maxDay = Math.max(...(stats?.dailyCounts.map((d) => d.count) ?? [1]), 1);

  return (
    <div className="min-h-screen px-4 py-10 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <div className="eyebrow mb-1">Super Admin</div>
          <h1 className="text-3xl font-black">Dashboard</h1>
          <p className="text-muted-foreground text-sm mt-1">Signed in as <span className="font-semibold text-foreground">{username}</span></p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => { loadStats(); loadShowcase(); }}
            className="inline-flex items-center gap-2 bg-muted hover:bg-muted/80 text-foreground text-sm font-medium px-4 py-2 rounded-xl transition-all"
            data-testid="button-refresh"
          >
            <RefreshCw className={`w-4 h-4 ${statsLoading || showcaseLoading ? "animate-spin" : ""}`} />
            Refresh
          </button>
          <button
            onClick={handleLogout}
            className="inline-flex items-center gap-2 bg-muted hover:bg-muted/80 text-foreground text-sm font-medium px-4 py-2 rounded-xl transition-all"
          >
            <LogOut className="w-4 h-4" />
            Sign out
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 mb-8 border-b border-border">
        {([
          { id: "dashboard", label: "Dashboard", icon: BarChart2 },
          { id: "upload",    label: "Upload video", icon: Upload },
          { id: "showcase",  label: "Showcase", icon: Sparkles },
        ] as { id: Tab; label: string; icon: typeof BarChart2 }[]).map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            data-testid={`tab-${id}`}
            className={`inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors ${
              tab === id
                ? "border-primary text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <Icon className="w-4 h-4" />
            {label}
          </button>
        ))}
      </div>

      {tab === "dashboard" && (
        <DashboardTab
          stats={stats}
          maxDay={maxDay}
          onDelete={handleDelete}
          onReplace={(p) => setReplaceTarget(p)}
        />
      )}

      {tab === "upload" && (
        <UploadTab
          onSuccess={() => { loadStats(); setTab("dashboard"); }}
        />
      )}

      {tab === "showcase" && (
        <ShowcaseTab
          items={showcase}
          onChange={loadShowcase}
          loading={showcaseLoading}
        />
      )}

      {replaceTarget && (
        <ReplaceVideoModal
          project={replaceTarget}
          onClose={() => setReplaceTarget(null)}
          onSuccess={() => { setReplaceTarget(null); loadStats(); }}
        />
      )}
    </div>
  );
}

// ── Dashboard tab ─────────────────────────────────────────────────────────────
function DashboardTab({
  stats, maxDay, onDelete, onReplace,
}: {
  stats: Stats | null;
  maxDay: number;
  onDelete: (id: number) => void;
  onReplace: (p: Stats["recentProjects"][number]) => void;
}) {
  return (
    <>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-10">
        {[
          { label: "Total renders", value: stats?.total ?? "—", icon: Video, color: "text-primary" },
          { label: "Completed", value: stats?.ready ?? "—", icon: CheckCircle, color: "text-green-500" },
          { label: "Processing", value: stats?.processing ?? "—", icon: Clock, color: "text-amber-500" },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="bg-card border border-border rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-3">
              <Icon className={`w-4 h-4 ${color}`} />
              <span className="text-sm text-muted-foreground">{label}</span>
            </div>
            <div className="text-3xl font-black">{value}</div>
          </div>
        ))}
      </div>

      {stats && stats.dailyCounts.length > 0 && (
        <div className="bg-card border border-border rounded-2xl p-6 mb-10">
          <div className="flex items-center gap-2 mb-6">
            <TrendingUp className="w-4 h-4 text-primary" />
            <h2 className="font-bold">Renders — last 30 days</h2>
          </div>
          <div className="flex items-end gap-1 h-32">
            {stats.dailyCounts.map(({ date, count }) => (
              <div key={date} className="flex-1 flex flex-col items-center gap-1 group" title={`${date}: ${count}`}>
                <div
                  className="w-full bg-primary/30 group-hover:bg-primary rounded-sm transition-all"
                  style={{ height: `${Math.max(4, (count / maxDay) * 112)}px` }}
                />
              </div>
            ))}
          </div>
          <div className="flex justify-between text-xs text-muted-foreground mt-2">
            <span>{stats.dailyCounts[0]?.date}</span>
            <span>{stats.dailyCounts[stats.dailyCounts.length - 1]?.date}</span>
          </div>
        </div>
      )}

      <div className="bg-card border border-border rounded-2xl overflow-hidden">
        <div className="flex items-center gap-2 px-6 py-4 border-b border-border">
          <BarChart2 className="w-4 h-4 text-primary" />
          <h2 className="font-bold">Recent projects</h2>
        </div>
        {!stats || stats.recentProjects.length === 0 ? (
          <div className="px-6 py-12 text-center text-muted-foreground text-sm">No projects yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-muted-foreground">
                  <th className="px-6 py-3 font-medium">ID</th>
                  <th className="px-6 py-3 font-medium">Title</th>
                  <th className="px-6 py-3 font-medium">Artist</th>
                  <th className="px-6 py-3 font-medium">Template</th>
                  <th className="px-6 py-3 font-medium">Format</th>
                  <th className="px-6 py-3 font-medium">Status</th>
                  <th className="px-6 py-3 font-medium">Created</th>
                  <th className="px-6 py-3 font-medium"></th>
                </tr>
              </thead>
              <tbody>
                {stats.recentProjects.map((p) => (
                  <tr key={p.id} className="border-b border-border/50 last:border-0 hover:bg-muted/30 transition-colors">
                    <td className="px-6 py-3 text-muted-foreground">#{p.id}</td>
                    <td className="px-6 py-3 font-medium max-w-[160px] truncate">{p.title}</td>
                    <td className="px-6 py-3 text-muted-foreground">{p.artistName || "—"}</td>
                    <td className="px-6 py-3 text-muted-foreground">{p.templateId}</td>
                    <td className="px-6 py-3">
                      <span className="bg-muted px-2 py-0.5 rounded text-xs">{p.format}</span>
                    </td>
                    <td className="px-6 py-3">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                        p.status === "ready"
                          ? "bg-green-500/10 text-green-500"
                          : p.status === "processing"
                          ? "bg-amber-500/10 text-amber-500"
                          : "bg-muted text-muted-foreground"
                      }`}>
                        {p.status}
                      </span>
                    </td>
                    <td className="px-6 py-3 text-muted-foreground whitespace-nowrap">
                      {new Date(p.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-3">
                      <div className="flex items-center gap-2 justify-end">
                        <button
                          onClick={() => onReplace(p)}
                          className="text-muted-foreground hover:text-primary transition-colors"
                          title="Replace video"
                          data-testid={`button-replace-${p.id}`}
                        >
                          <Replace className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => onDelete(p.id)}
                          className="text-muted-foreground hover:text-red-500 transition-colors"
                          title="Delete project"
                          data-testid={`button-delete-${p.id}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}

// ── Upload tab — create a new project from a video file ───────────────────────
function UploadTab({ onSuccess }: { onSuccess: () => void }) {
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [artist, setArtist] = useState("");
  const [format, setFormat] = useState<Format>("square");
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState<string>("");
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!file || !title) { setError("Title and video file are required"); return; }
    setUploading(true);
    try {
      setProgress("Uploading video...");
      const objectPath = await adminUploadFile(file);

      setProgress("Creating project...");
      const r = await fetch(`${API}/admin/projects`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          artistName: artist || null,
          templateId: "admin-upload",
          format,
          videoObjectPath: objectPath,
        }),
      });
      if (!r.ok) throw new Error("Server rejected the project");
      setProgress("");
      setFile(null); setTitle(""); setArtist("");
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
      setProgress("");
    }
  };

  return (
    <form onSubmit={submit} className="bg-card border border-border rounded-2xl p-8 space-y-6 max-w-2xl">
      <div>
        <h2 className="font-bold text-xl mb-1">New video project</h2>
        <p className="text-muted-foreground text-sm">Upload a finished video file. It will appear as a "ready" project in the dashboard, with no owner.</p>
      </div>

      {/* File picker */}
      <div>
        <label className="block text-sm font-semibold mb-2">Video file</label>
        <input
          ref={inputRef}
          type="file"
          accept="video/*"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          className="hidden"
          data-testid="input-video-file"
        />
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="w-full border-2 border-dashed border-border hover:border-primary/50 rounded-xl px-4 py-8 text-left transition-colors"
        >
          {file ? (
            <div className="flex items-center gap-3">
              <Film className="w-8 h-8 text-primary shrink-0" />
              <div className="min-w-0">
                <div className="font-medium truncate">{file.name}</div>
                <div className="text-xs text-muted-foreground">{(file.size / 1024 / 1024).toFixed(1)} MB · {file.type || "unknown"}</div>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3 text-muted-foreground">
              <Upload className="w-6 h-6" />
              <span className="text-sm">Click to choose a .mp4, .webm or .mov file</span>
            </div>
          )}
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-semibold mb-2" htmlFor="up-title">Title</label>
          <input
            id="up-title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
            placeholder="My new track"
            required
            data-testid="input-title"
          />
        </div>
        <div>
          <label className="block text-sm font-semibold mb-2" htmlFor="up-artist">Artist</label>
          <input
            id="up-artist"
            value={artist}
            onChange={(e) => setArtist(e.target.value)}
            className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
            placeholder="(optional)"
            data-testid="input-artist"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-semibold mb-2">Format</label>
        <div className="flex gap-2">
          {FORMATS.map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setFormat(f)}
              className={`flex-1 px-3 py-2 rounded-xl border text-sm font-medium capitalize transition-colors ${
                format === f
                  ? "border-primary bg-primary/10 text-foreground"
                  : "border-border text-muted-foreground hover:border-border/80"
              }`}
              data-testid={`button-format-${f}`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">{error}</div>
      )}
      {progress && (
        <div className="text-sm text-muted-foreground flex items-center gap-2">
          <RefreshCw className="w-4 h-4 animate-spin" /> {progress}
        </div>
      )}

      <button
        type="submit"
        disabled={uploading || !file || !title}
        className="w-full bg-primary hover:bg-primary/90 text-white font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        data-testid="button-submit-upload"
      >
        {uploading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
        {uploading ? "Working..." : "Create project"}
      </button>
    </form>
  );
}

// ── Replace-video modal ───────────────────────────────────────────────────────
function ReplaceVideoModal({
  project, onClose, onSuccess,
}: {
  project: Stats["recentProjects"][number];
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [working, setWorking] = useState(false);
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const submit = async () => {
    if (!file) return;
    setError(""); setWorking(true);
    try {
      const objectPath = await adminUploadFile(file);
      const r = await fetch(`${API}/admin/projects/${project.id}`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ videoObjectPath: objectPath }),
      });
      if (!r.ok) throw new Error("Server rejected the update");
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed");
    } finally {
      setWorking(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4" onClick={onClose}>
      <div
        className="bg-card border border-border rounded-2xl p-8 w-full max-w-md relative"
        onClick={(e) => e.stopPropagation()}
      >
        <button onClick={onClose} className="absolute top-4 right-4 text-muted-foreground hover:text-foreground">
          <X className="w-5 h-5" />
        </button>
        <h2 className="font-bold text-xl mb-1">Replace video</h2>
        <p className="text-muted-foreground text-sm mb-6">For <span className="text-foreground font-medium">{project.title}</span> (#{project.id})</p>

        <input
          ref={inputRef}
          type="file"
          accept="video/*"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          className="hidden"
        />
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="w-full border-2 border-dashed border-border hover:border-primary/50 rounded-xl px-4 py-6 text-left transition-colors mb-4"
          data-testid="button-replace-pick"
        >
          {file ? (
            <div className="flex items-center gap-3">
              <Film className="w-6 h-6 text-primary shrink-0" />
              <div className="min-w-0 text-sm">
                <div className="font-medium truncate">{file.name}</div>
                <div className="text-xs text-muted-foreground">{(file.size / 1024 / 1024).toFixed(1)} MB</div>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3 text-muted-foreground text-sm">
              <Upload className="w-5 h-5" /> Choose replacement video
            </div>
          )}
        </button>

        {error && (
          <div className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 mb-4">{error}</div>
        )}

        <button
          onClick={submit}
          disabled={!file || working}
          className="w-full bg-primary hover:bg-primary/90 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 disabled:opacity-50"
          data-testid="button-replace-submit"
        >
          {working ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Replace className="w-4 h-4" />}
          {working ? "Uploading..." : "Replace"}
        </button>
      </div>
    </div>
  );
}

// ── Showcase tab ──────────────────────────────────────────────────────────────
function ShowcaseTab({
  items, onChange, loading,
}: { items: ShowcaseItem[]; onChange: () => void; loading: boolean }) {
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [position, setPosition] = useState(0);
  const [working, setWorking] = useState(false);
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !title) return;
    setError(""); setWorking(true);
    try {
      const objectPath = await adminUploadFile(file);
      const r = await fetch(`${API}/admin/showcase`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          subtitle: subtitle || null,
          videoObjectPath: objectPath,
          position,
        }),
      });
      if (!r.ok) throw new Error("Server rejected the upload");
      setFile(null); setTitle(""); setSubtitle(""); setPosition(0);
      onChange();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed");
    } finally {
      setWorking(false);
    }
  };

  const remove = async (id: number) => {
    if (!confirm("Remove this showcase video?")) return;
    await fetch(`${API}/admin/showcase/${id}`, { method: "DELETE", credentials: "include" });
    onChange();
  };

  return (
    <div className="space-y-8">
      <form onSubmit={submit} className="bg-card border border-border rounded-2xl p-8 space-y-5 max-w-2xl">
        <div>
          <h2 className="font-bold text-xl mb-1">Add showcase video</h2>
          <p className="text-muted-foreground text-sm">Public — appears on the home page as a featured demo.</p>
        </div>

        <input
          ref={inputRef}
          type="file"
          accept="video/*"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          className="hidden"
          data-testid="input-showcase-file"
        />
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="w-full border-2 border-dashed border-border hover:border-primary/50 rounded-xl px-4 py-6 text-left transition-colors"
        >
          {file ? (
            <div className="flex items-center gap-3">
              <Film className="w-6 h-6 text-primary shrink-0" />
              <div className="min-w-0 text-sm">
                <div className="font-medium truncate">{file.name}</div>
                <div className="text-xs text-muted-foreground">{(file.size / 1024 / 1024).toFixed(1)} MB</div>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3 text-muted-foreground text-sm">
              <Upload className="w-5 h-5" /> Choose a showcase video
            </div>
          )}
        </button>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold mb-2">Title</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
              data-testid="input-showcase-title"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold mb-2">Position</label>
            <input
              type="number"
              value={position}
              onChange={(e) => setPosition(parseInt(e.target.value || "0", 10))}
              className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-semibold mb-2">Subtitle</label>
          <input
            value={subtitle}
            onChange={(e) => setSubtitle(e.target.value)}
            placeholder="Optional caption"
            className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
          />
        </div>

        {error && (
          <div className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">{error}</div>
        )}

        <button
          type="submit"
          disabled={!file || !title || working}
          className="w-full bg-primary hover:bg-primary/90 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 disabled:opacity-50"
          data-testid="button-submit-showcase"
        >
          {working ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
          {working ? "Uploading..." : "Add to showcase"}
        </button>
      </form>

      <div>
        <h3 className="font-bold mb-3">Current showcase</h3>
        {loading ? (
          <div className="text-muted-foreground text-sm">Loading...</div>
        ) : items.length === 0 ? (
          <div className="text-muted-foreground text-sm">No showcase videos yet.</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {items.map((s) => (
              <div key={s.id} className="bg-card border border-border rounded-2xl overflow-hidden">
                <video
                  src={`${API}/storage/showcase-objects${s.videoObjectPath.replace(/^\/objects/, "")}`}
                  className="w-full aspect-square bg-black object-cover"
                  controls
                  preload="metadata"
                />
                <div className="p-4">
                  <div className="font-semibold truncate">{s.title}</div>
                  {s.subtitle && <div className="text-xs text-muted-foreground truncate">{s.subtitle}</div>}
                  <div className="flex items-center justify-between mt-3">
                    <span className="text-xs text-muted-foreground">pos {s.position}</span>
                    <button
                      onClick={() => remove(s.id)}
                      className="text-muted-foreground hover:text-red-500 transition-colors"
                      title="Remove"
                      data-testid={`button-remove-showcase-${s.id}`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
