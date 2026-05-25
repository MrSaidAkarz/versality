import { useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/context/auth";
import { Music2 } from "lucide-react";

interface Props {
  component: React.ComponentType;
}

export function ProtectedRoute({ component: Component }: Props) {
  const { user, loading } = useAuth();
  const [, navigate] = useLocation();

  useEffect(() => {
    if (!loading && !user) {
      navigate("/login");
    }
  }, [loading, user, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4 text-muted-foreground">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center animate-pulse" style={{ boxShadow: "0 0 28px hsl(328 90% 63% / 0.25)" }}>
            <Music2 className="w-5 h-5 text-white" />
          </div>
          <p className="text-sm">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  return <Component />;
}
