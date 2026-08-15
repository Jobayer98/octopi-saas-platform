"use client";
import { useForm } from "react-hook-form";
import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import Cookies from "js-cookie";
import { api, getApiError } from "@/lib/api-client";
import { useAuthStore } from "@/stores/auth";
import { AuthResponse } from "@/types";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

interface LoginForm { email: string; password: string }

export default function LoginPage() {
  const router = useRouter();
  const { setAuth } = useAuthStore();
  const { register, handleSubmit, formState: { errors } } = useForm<LoginForm>();

  const login = useMutation({
    mutationFn: (data: LoginForm) => api.post<AuthResponse>("/auth/login", data),
    onSuccess: ({ data }) => {
      setAuth(data.user, data.accessToken);
      Cookies.set("role", data.user.role, { sameSite: "lax" });
      const dash =
        data.user.role === "PLATFORM_ADMIN"
          ? "/platform/dashboard"
          : data.user.role === "ORG_ADMIN"
          ? "/org/dashboard"
          : "/me/profile";
      router.push(dash);
    },
    onError: (err) => toast.error(getApiError(err)),
  });

  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle>Sign in</CardTitle>
        <CardDescription>Enter your credentials to access your account.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit((d) => login.mutate(d))} className="space-y-4">
          <div className="space-y-1">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="you@company.com"
              {...register("email", { required: "Email is required" })}
            />
            {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
          </div>
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <Label htmlFor="password">Password</Label>
              <Link href="/forgot-password" className="text-xs text-muted-foreground hover:underline">
                Forgot password?
              </Link>
            </div>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              {...register("password", { required: "Password is required" })}
            />
            {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
          </div>
          <Button type="submit" className="w-full" disabled={login.isPending}>
            {login.isPending ? "Signing in…" : "Sign in"}
          </Button>
          <p className="text-sm text-center text-muted-foreground">
            No account?{" "}
            <Link href="/register" className="underline text-foreground">
              Register your organization
            </Link>
          </p>
        </form>
      </CardContent>
    </Card>
  );
}
