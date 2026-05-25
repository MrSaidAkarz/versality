import { Link, useLocation } from "wouter";
import { Music2, LogOut, User } from "lucide-react";
import { useAuth } from "@/context/auth";

const API = import.meta.env.BASE_URL.replace(/\/$/, "").replace(/^(\/[^/]+).*$/, "$1") + "/api";

const NAV_LINKS = [
  { href: "/create",     label: "Create"    },
  { href: "/projects",   label: "Projects"  },
  { href: "/templates",  label: "Templates" },
  { href: "/pricing",    label: "Pricing"   },
  { href: "/about",      label: "About"     },
  { href: "/social-kit", label: "Social Kit"},
];

export function Nav() {
  const [location] = useLocation();
  const { user, refetch } = useAuth();

  const handleLogout = async () => {
    await fetch(`${API}/auth/logout`, { method: "POST", credentials: "include" });
    await refetch();
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-border/40 bg-background/85 backdrop-blur-2xl">
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">

        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-8 h-8 rounded-xl bg-primary flex items-center justify-center shadow-lg shadow-primary/30 group-hover:shadow-primary/50 transition-shadow duration-300">
            <Music2 className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold text-base tracking-tight text-foreground">Versality</span>
        </Link>

        {/* Nav links */}
        <div className="hidden md:flex items-center gap-0.5">
          {NAV_LINKS.slice(0, -1).map(({ href, label }) => {
            const active = location === href;
            return (
              <Link
                key={href}
                href={href}
                data-testid={`nav-link-${label.toLowerCase()}`}
                className={`px-3.5 py-2 rounded-lg text-sm font-medium transition-all duration-150 ${
                  active
                    ? "text-primary bg-primary/8"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
                }`}
              >
                {label}
              </Link>
            );
          })}
        </div>

        {/* Right side */}
        <div className="flex items-center gap-2">
          <Link
            href="/social-kit"
            data-testid="nav-link-social-kit"
            className={`hidden md:block px-3.5 py-2 rounded-lg text-sm font-medium transition-all duration-150 ${
              location === "/social-kit"
                ? "text-primary bg-primary/8"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
            }`}
          >
            Social Kit
          </Link>

          {user ? (
            <>
              <div className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-muted/50 text-sm text-muted-foreground">
                <User className="w-3.5 h-3.5" />
                <span className="font-medium text-foreground max-w-[120px] truncate">{user.name}</span>
                {user.plan !== "starter" && (
                  <span className="text-[10px] font-bold uppercase tracking-wider text-primary bg-primary/10 px-1.5 py-0.5 rounded-full">
                    {user.plan}
                  </span>
                )}
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-all duration-150"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden md:inline">Log out</span>
              </button>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="px-4 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-all duration-150"
              >
                Log in
              </Link>
              <Link
                href="/signup"
                className="inline-flex items-center gap-1.5 bg-primary hover:bg-primary/90 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-all duration-150 hover:scale-[1.02] active:scale-[0.98] shadow-md shadow-primary/25"
              >
                Sign up
              </Link>
            </>
          )}
        </div>

      </div>
    </nav>
  );
}
