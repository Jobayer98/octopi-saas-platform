"use client";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "@/lib/query-client";
import { Toaster } from "@/components/ui/sonner";
import { useBootstrapAuth } from "@/lib/hooks/use-auth";

function AuthBootstrap({ children }: { children: React.ReactNode }) {
  useBootstrapAuth();
  return <>{children}</>;
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthBootstrap>{children}</AuthBootstrap>
      <Toaster richColors position="top-right" />
    </QueryClientProvider>
  );
}
