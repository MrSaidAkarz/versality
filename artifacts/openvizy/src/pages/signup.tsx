import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Lock, Mail, RefreshCw, Music2, User } from "lucide-react";
import { useAuth } from "@/context/auth";

const API = import.meta.env.BASE_URL.replace(/\/$/, "").replace(/^(\/[^/]+).*$/, "$1") + "/api";

export default function Signup() {
  const [, navigate] = useLocation();
  const { refetch } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const r = await fetch(`${API}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ name, email, password }),
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
      <div className="orb orb-blue animate-aurora" style={{ width: 480, height: 480, top: "-15%", right: "-10%", opacity: 0.15 }} />
      <div className="orb orb-pink animate-aurora" style={{ width: 400, height: 400, bottom: "-10%", left: "-8%", opacity: 0.12, animationDelay: "-4s" }} />

      <div className="w-full max-w-sm relative z-10">
        <div className="flex flex-col items-center mb-8">
          <Link href="/">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center mb-4 shadow-lg cursor-pointer" style={{ boxShadow: "0 0 28px hsl(328 90% 63% / 0.3)" }}>
              <Music2 className="w-5 h-5 text-white" />
            </div>
          </Link>
          <h1 className="text-2xl font-black">Create your account</h1>
          <p className="text-muted-foreground text-sm mt-1">Join Versality — it only takes a second</p>
        </div>

        <div className="relative rounded-2xl p-px bg-gradient-to-br from-accent/30 via-border to-primary/20">
          <div className="bg-card rounded-2xl p-8">
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-semibold mb-2" htmlFor="name">Artist / Display name</label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input id="name" type="text" autoComplete="name" value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-background border border-border rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/50 transition-all"
                    placeholder="Your artist name" required />
                </div>
              </div>

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
                <label className="block text-sm font-semibold mb-2" htmlFor="password">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input id="password" type="password" autoComplete="new-password" value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-background border border-border rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/50 transition-all"
                    placeholder="Min 8 characters" minLength={8} required />
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
                  ? <><RefreshCw className="w-4 h-4 animate-spin" /> Creating account...</>
                  : "Create account"}
              </button>

              <p className="text-xs text-muted-foreground text-center">
                By signing up you agree to our{" "}
                <a href="#" className="text-primary hover:underline">Terms</a> and{" "}
                <a href="#" className="text-primary hover:underline">Privacy Policy</a>.
              </p>
            </form>
          </div>
        </div>

        <p className="text-center text-sm text-muted-foreground mt-5">
          Already have an account?{" "}
          <Link href="/login" className="text-primary font-semibold hover:underline">Log in</Link>
        </p>
      </div>
    </div>
  );
}
