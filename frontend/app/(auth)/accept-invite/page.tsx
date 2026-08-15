"use client";
import { Suspense } from "react";
import { useForm } from "react-hook-form";
import { useMutation } from "@tanstack/react-query";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { api, getApiError } from "@/lib/api-client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

interface AcceptForm {
  name: string;
  password: string;
}

function AcceptInviteForm() {
  const router = useRouter();
  const params = useSearchParams();
  const token = params.get("token") ?? "";

  const { register, handleSubmit, formState: { errors } } = useForm<AcceptForm>();

  const accept = useMutation({
    mutationFn: (data: AcceptForm) =>
      api.post("/org/members/accept-invite", { token, ...data }),
    onSuccess: () => {
      toast.success("Account created! Please sign in.");
      router.push("/login");
    },
    onError: (err) => toast.error(getApiError(err)),
  });

  if (!token) {
    return (
      <p className="text-sm text-destructive text-center">
        Invalid invite link. Please request a new invite.
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmit((d) => accept.mutate(d))} className="space-y-4">
      <div className="space-y-1">
        <Label>Your name</Label>
        <Input
          {...register("name", { required: "Name is required" })}
          placeholder="Jane Smith"
        />
        {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
      </div>
      <div className="space-y-1">
        <Label>Password</Label>
        <Input
          type="password"
          {...register("password", {
            required: "Password is required",
            minLength: { value: 8, message: "Min 8 characters" },
          })}
          placeholder="••••••••"
        />
        {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
      </div>
      <Button type="submit" className="w-full" disabled={accept.isPending}>
        {accept.isPending ? "Creating account…" : "Accept invite & create account"}
      </Button>
    </form>
  );
}

export default function AcceptInvitePage() {
  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle>Accept invitation</CardTitle>
        <CardDescription>Set up your account to join the organization.</CardDescription>
      </CardHeader>
      <CardContent>
        <Suspense fallback={<p className="text-muted-foreground text-sm">Loading…</p>}>
          <AcceptInviteForm />
        </Suspense>
      </CardContent>
    </Card>
  );
}
