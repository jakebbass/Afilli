import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useTRPC } from "~/trpc/react";

export const Route = createFileRoute("/auth/login")({
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const trpc = useTRPC();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const loginMutation = useMutation(
    trpc.auth.login.mutationOptions({
      onSuccess: (data) => {
        // Store token in localStorage
        localStorage.setItem("auth_token", data.token);

        // Redirect to dashboard
        void navigate({ to: "/dashboard" });
      },
      onError: (err) => {
        setError(err.message);
      },
    }),
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    loginMutation.mutate({ email, password });
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))]" />

      <div className="relative w-full max-w-md px-6">
        <div className="rounded-2xl border border-white/20 bg-white/10 p-8 shadow-2xl backdrop-blur-lg">
          {/* Logo/Brand */}
          <div className="mb-8 text-center">
            <h1 className="mb-2 text-3xl font-bold text-white">🎯 Afilli</h1>
            <p className="text-sm text-slate-300">
              AI-Powered Affiliate Marketing Platform
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 rounded-lg border border-red-500/50 bg-red-500/20 p-4">
              <p className="text-sm text-red-200">{error}</p>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label
                htmlFor="email"
                className="mb-2 block text-sm font-medium text-slate-200"
              >
                Email Address
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full rounded-lg border border-white/20 bg-white/10 px-4 py-3 text-white placeholder-slate-400 transition focus:border-transparent focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="you@example.com"
                autoComplete="email"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="mb-2 block text-sm font-medium text-slate-200"
              >
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full rounded-lg border border-white/20 bg-white/10 px-4 py-3 text-white placeholder-slate-400 transition focus:border-transparent focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="••••••••"
                autoComplete="current-password"
              />
            </div>

            <button
              type="submit"
              disabled={loginMutation.isPending}
              className="w-full transform rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 px-4 py-3 font-semibold text-white shadow-lg transition duration-200 hover:scale-[1.02] hover:from-purple-700 hover:to-pink-700 disabled:scale-100 disabled:cursor-not-allowed disabled:from-slate-600 disabled:to-slate-700"
            >
              {loginMutation.isPending ? (
                <span className="flex items-center justify-center">
                  <svg
                    className="-ml-1 mr-3 h-5 w-5 animate-spin text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Signing in...
                </span>
              ) : (
                "Sign In"
              )}
            </button>
          </form>

          {/* Sign Up Link */}
          <div className="mt-6 text-center">
            <p className="text-sm text-slate-300">
              Don't have an account?{" "}
              <Link
                to="/auth/register"
                className="font-semibold text-purple-400 transition hover:text-purple-300"
              >
                Create one
              </Link>
            </p>
          </div>

          {/* Demo Credentials */}
          <div className="mt-6 border-t border-white/10 pt-6">
            <p className="mb-2 text-center text-xs text-slate-400">
              Demo Credentials:
            </p>
            <div className="rounded-lg bg-slate-900/50 p-3 font-mono text-xs">
              <div className="text-slate-300">
                <span className="text-slate-500">Email:</span> admin@afilli.com
              </div>
              <div className="text-slate-300">
                <span className="text-slate-500">Pass:</span> admin123
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <p className="mt-6 text-center text-xs text-slate-400">
          © 2025 Afilli. All rights reserved.
        </p>
      </div>
    </div>
  );
}
