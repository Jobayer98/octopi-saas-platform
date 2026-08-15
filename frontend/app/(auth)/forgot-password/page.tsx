"use client";
import { useForm } from "react-hook-form";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import Link from "next/link";
import { api, getApiError } from "@/lib/api-client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

export default function ForgotPasswordPage() {
  const { register, handleSubmit } = useForm<{ email: string }>();

  const send = useMutation({
    mutationFn: (data: { email: string }) => api.post("/auth/forgot-password", data),
    onSuccess: () => toast.success("If that email exists, a reset link was sent."),
    onError: (err) => toast.error(getApiError(err)),
  });

  return (
    <Card className="w-full max-w-sm">
      <CardHeader><CardTitle>Reset password</CardTitle></CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit((d) => send.mutate(d))} className="space-y-4">
          <div className="space-y-1">
            <Label>Email</Label>
            <Input type="email" {...register("email", { required: true })} />
          </div>
          <Button type="submit" className="w-full" disabled={send.isPending}>
            {send.isPending ? "Sending…" : "Send reset link"}
          </Button>
          <p className="text-sm text-center">
            <Link href="/login" className="underline text-muted-foreground">Back to login</Link>
          </p>
        </form>
      </CardContent>
    </Card>
  );
}
