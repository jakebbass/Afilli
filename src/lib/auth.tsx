import { createContext, useContext, useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useTRPC } from "~/trpc/react";

interface User {
  id: string;
  email: string;
  name: string | null;
  role: string;
  subscription: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const trpc = useTRPC();
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const token =
    typeof window !== "undefined" ? localStorage.getItem("auth_token") : null;

  const { data, isLoading, error } = useQuery({
    ...trpc.auth.getCurrentUser.queryOptions(),
    enabled: !!token,
    retry: false,
  });

  useEffect(() => {
    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }

    if (data) {
      setUser(data as User);
      setLoading(false);
    }

    if (error) {
      // Token is invalid, clear it
      localStorage.removeItem("auth_token");
      setUser(null);
      setLoading(false);
    }
  }, [data, error, token]);

  useEffect(() => {
    if (isLoading !== loading) {
      setLoading(isLoading);
    }
  }, [isLoading, loading]);

  const logout = () => {
    localStorage.removeItem("auth_token");
    setUser(null);
    void navigate({ to: "/auth/login" });
  };

  return (
    <AuthContext.Provider value={{ user, loading, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

export function useRequireAuth() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) {
      void navigate({ to: "/auth/login" });
    }
  }, [user, loading, navigate]);

  return { user, loading };
}
