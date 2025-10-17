import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useTRPC } from "~/trpc/react";

export const Route = createFileRoute("/auth/register")({
  component: RegisterPage,
});

function RegisterPage() {
  const navigate = useNavigate();
  const trpc = useTRPC();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");

  const registerMutation = useMutation(
    trpc.auth.register.mutationOptions({
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

    // Validate passwords match
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    // Validate password length
    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }

    registerMutation.mutate({ email, password, name: name || undefined });
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))]" />

      <div className="relative w-full max-w-md px-6">
        <div className="rounded-2xl border border-white/20 bg-white/10 p-8 shadow-2xl backdrop-blur-lg">
          {/* Logo/Brand */}
          <div className="mb-8 text-center">
            <h1 className="mb-2 text-3xl font-bold text-white">🎯 Afilli</h1>
            <p className="text-sm text-slate-300">Create your account</p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 rounded-lg border border-red-500/50 bg-red-500/20 p-4">
              <p className="text-sm text-red-200">{error}</p>
            </div>
          )}

          {/* Register Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label
                htmlFor="name"
                className="mb-2 block text-sm font-medium text-slate-200"
              >
                Full Name (Optional)
              </label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-lg border border-white/20 bg-white/10 px-4 py-3 text-white placeholder-slate-400 transition focus:border-transparent focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="John Doe"
                autoComplete="name"
              />
            </div>

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
                minLength={8}
                className="w-full rounded-lg border border-white/20 bg-white/10 px-4 py-3 text-white placeholder-slate-400 transition focus:border-transparent focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="••••••••"
                autoComplete="new-password"
              />
              <p className="mt-1 text-xs text-slate-400">
                Must be at least 8 characters
              </p>
            </div>

            <div>
              <label
                htmlFor="confirmPassword"
                className="mb-2 block text-sm font-medium text-slate-200"
              >
                Confirm Password
              </label>
              <input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={8}
                className="w-full rounded-lg border border-white/20 bg-white/10 px-4 py-3 text-white placeholder-slate-400 transition focus:border-transparent focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="••••••••"
                autoComplete="new-password"
              />
            </div>

            <button
              type="submit"
              disabled={registerMutation.isPending}
              className="w-full transform rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 px-4 py-3 font-semibold text-white shadow-lg transition duration-200 hover:scale-[1.02] hover:from-purple-700 hover:to-pink-700 disabled:scale-100 disabled:cursor-not-allowed disabled:from-slate-600 disabled:to-slate-700"
            >
              {registerMutation.isPending ? (
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
                  Creating account...
                </span>
              ) : (
                "Create Account"
              )}
            </button>
          </form>

          {/* Sign In Link */}
          <div className="mt-6 text-center">
            <p className="text-sm text-slate-300">
              Already have an account?{" "}
              <Link
                to="/auth/login"
                className="font-semibold text-purple-400 transition hover:text-purple-300"
              >
                Sign in
              </Link>
            </p>
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
