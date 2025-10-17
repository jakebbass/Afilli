import {
  Outlet,
  createRootRoute,
  useRouterState,
} from "@tanstack/react-router";
import { Toaster } from "react-hot-toast";
import { TRPCReactProvider } from "~/trpc/react";
import { AuthProvider } from "~/lib/auth";

export const Route = createRootRoute({
  component: RootComponent,
});

function RootComponent() {
  return (
    <TRPCReactProvider>
      <AuthProvider>
        <RootContent />
      </AuthProvider>
    </TRPCReactProvider>
  );
}

function RootContent() {
  const isFetching = useRouterState({ select: (s) => s.isLoading });

  if (isFetching) {
    return <div>Loading...</div>;
  }

  return (
    <>
      <Toaster position="top-right" />
      <Outlet />
    </>
  );
}
