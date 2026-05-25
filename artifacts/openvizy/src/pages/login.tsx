import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Lock, Mail, RefreshCw, Music2 } from "lucide-react";
import { useAuth } from "@/context/auth";

const API = import.meta.env.BASE_URL.replace(/\/$/, "").replace(/^(\/[^/]+).*$/, "$1") + "/api";

export default function Login() {
  const [, navigate] = useLocation();
  const { refetch } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const r = await fetch(`${API}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email, password }),
      });
      const d = await r.json();
      if (r.ok) {
        await refetch();
        navigate("/create");
      } else {
        setError(d.error || "Something went wrong.");
      }
    } catch {
      setError("Network error — please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden">
      <div className="orb orb-pink animate-aurora" style={{ width: 480, height: 480, top: "-15%", left: "-10%", opacity: 0.15 }} />
      <div className="orb orb-blue animate-aurora" style={{ width: 400, height: 400, bottom: "-10%", right: "-8%", opacity: 0.12, animationDelay: "-4s" }} />

      <div className="w-full max-w-sm relative z-10">
        <div className="flex flex-col items-center mb-8">
          <Link href="/">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center mb-4 shadow-lg cursor-pointer" style={{ boxShadow: "0 0 28px hsl(328 90% 63% / 0.3)" }}>
              <Music2 className="w-5 h-5 text-white" />
            </div>
          </Link>
          <h1 className="text-2xl font-black">Welcome back</h1>
          <p className="text-muted-foreground text-sm mt-1">Log in to your Versality account</p>
        </div>

        <div className="relative rounded-2xl p-px bg-gradient-to-br from-primary/30 via-border to-accent/20">
          <div className="bg-card rounded-2xl p-8">
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-semibold mb-2" htmlFor="email">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input id="email" type="email" autoComplete="email" value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-background border border-border rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/50 transition-all"
                    placeholder="you@example.com" required />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-semibold" htmlFor="password">Password</label>
                  <a href="#" className="text-xs text-primary hover:underline">Forgot password?</a>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input id="password" type="password" autoComplete="current-password" value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-background border border-border rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/50 transition-all"
                    placeholder="••••••••" required />
                </div>
              </div>

              {error && (
                <div className="flex items-center gap-2 text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-400 shrink-0" />
                  {error}
                </div>
              )}

              <button type="submit" disabled={loading}
                className="w-full shimmer-btn bg-primary hover:bg-primary/90 text-white font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50 mt-1"
                style={{ boxShadow: loading ? "none" : "0 0 20px hsl(328 90% 63% / 0.35)" }}>
                {loading
                  ? <><RefreshCw className="w-4 h-4 animate-spin" /> Logging in...</>
                  : "Log in"}
              </button>
            </form>
          </div>
        </div>

        <p className="text-center text-sm text-muted-foreground mt-5">
          Don't have an account?{" "}
          <Link href="/signup" className="text-primary font-semibold hover:underline">Sign up</Link>
        </p>
      </div>
    </div>
  );
}
