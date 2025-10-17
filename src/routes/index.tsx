import { createFileRoute, Navigate } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  component: Home,
});

function Home() {
  // Check if user is authenticated
  const token =
    typeof window !== "undefined" ? localStorage.getItem("auth_token") : null;

  if (token) {
    return <Navigate to="/dashboard" />;
  }

  return <Navigate to="/auth/login" />;
}
