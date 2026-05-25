import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

const API = import.meta.env.BASE_URL.replace(/\/$/, "").replace(/^(\/[^/]+).*$/, "$1") + "/api";

interface AuthUser {
  id: number;
  name: string;
  email: string;
  plan: string;
}

interface AuthState {
  user: AuthUser | null;
  loading: boolean;
  refetch: () => Promise<void>;
}

const AuthContext = createContext<AuthState>({ user: null, loading: true, refetch: async () => {} });

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchMe = async () => {
    try {
      const r = await fetch(`${API}/auth/me`, { credentials: "include" });
      const d = await r.json();
      setUser(d.authenticated ? d.user : null);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchMe(); }, []);

  return (
    <AuthContext.Provider value={{ user, loading, refetch: fetchMe }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
