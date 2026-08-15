"use client";
import { Suspense } from "react";
import { useForm } from "react-hook-form";
import { useMutation } from "@tanstack/react-query";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { api, getApiError } from "@/lib/api-client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

function ResetForm() {
  const router = useRouter();
  const params = useSearchParams();
  const token = params.get("token") ?? "";
  const { register, handleSubmit } = useForm<{ password: string }>();

  const reset = useMutation({
    mutationFn: (data: { password: string }) =>
      api.post("/auth/reset-password", { token, password: data.password }),
    onSuccess: () => {
      toast.success("Password updated. Please log in.");
      router.push("/login");
    },
    onError: (err) => toast.error(getApiError(err)),
  });

  return (
    <form onSubmit={handleSubmit((d) => reset.mutate(d))} className="space-y-4">
      <div className="space-y-1">
        <Label>New password</Label>
        <Input type="password" {...register("password", { required: true, minLength: 8 })} />
      </div>
      <Button type="submit" className="w-full" disabled={reset.isPending}>
        {reset.isPending ? "Saving…" : "Set password"}
      </Button>
    </form>
  );
}

export default function ResetPasswordPage() {
  return (
    <Card className="w-full max-w-sm">
      <CardHeader><CardTitle>Set new password</CardTitle></CardHeader>
      <CardContent>
        <Suspense fallback={<p className="text-muted-foreground text-sm">Loading…</p>}>
          <ResetForm />
        </Suspense>
      </CardContent>
    </Card>
  );
}
