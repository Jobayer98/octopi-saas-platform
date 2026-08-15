"use client";
import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { usePathname } from "next/navigation";
import { api } from "@/lib/api-client";
import { useAuthStore } from "@/stores/auth";
import { AuthResponse } from "@/types";

const AUTH_PATHS = ["/login", "/register", "/forgot-password", "/reset-password"];

export function useBootstrapAuth() {
  const { setAuth } = useAuthStore();
  const pathname = usePathname();
  const isAuthPage = AUTH_PATHS.some((p) => pathname.startsWith(p));

  const { data, isLoading } = useQuery<AuthResponse>({
    queryKey: ["auth", "bootstrap"],
    queryFn: async () => {
      const res = await api.post<AuthResponse>("/auth/refresh");
      return res.data;
    },
    enabled: !isAuthPage,   // don't run on login/register/etc.
    retry: false,
    staleTime: Infinity,
  });

  useEffect(() => {
    if (data) setAuth(data.user, data.accessToken);
  }, [data, setAuth]);

  return { isLoading: isAuthPage ? false : isLoading };
}

export function useCurrentUser() {
  return useAuthStore((s) => s.user);
}
