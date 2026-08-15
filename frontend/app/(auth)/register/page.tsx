"use client";
import { useForm } from "react-hook-form";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { api, getApiError } from "@/lib/api-client";
import { Plan } from "@/types";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface RegisterForm {
  orgName: string;
  billingEmail: string;
  name: string;
  email: string;
  password: string;
  planId: string;
}

export default function RegisterPage() {
  const router = useRouter();
  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<RegisterForm>();

  const { data: plans } = useQuery<Plan[]>({
    queryKey: ["plans"],
    queryFn: async () => {
      const res = await api.get<Plan[]>("/plans");
      return res.data.filter((p) => p.isActive);
    },
  });

  const submit = useMutation({
    mutationFn: async (data: RegisterForm): Promise<{ orgId: string }> => {
      const res = await api.post<{ orgId: string }>("/auth/register", data);
      return res.data;
    },
    onSuccess: (data) => {
      router.push(`/checkout/${data.orgId}`);
    },
    onError: (err) => toast.error(getApiError(err)),
  });

  const selectedPlanId = watch("planId");
  const selectedPlan = plans?.find((p) => p.id === selectedPlanId);

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Register your organization</CardTitle>
        <CardDescription>Create your account and choose a plan to get started.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit((d) => submit.mutate(d))} className="space-y-4">
          <div className="space-y-1">
            <Label>Organization name</Label>
            <Input
              placeholder="Acme Corp"
              {...register("orgName", { required: "Organization name is required" })}
            />
            {errors.orgName && <p className="text-xs text-destructive">{errors.orgName.message}</p>}
          </div>

          <div className="space-y-1">
            <Label>Billing email</Label>
            <Input
              type="email"
              placeholder="billing@company.com"
              {...register("billingEmail", { required: "Billing email is required" })}
            />
            {errors.billingEmail && <p className="text-xs text-destructive">{errors.billingEmail.message}</p>}
          </div>

          <div className="border-t pt-4 space-y-4">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Admin account</p>
            <div className="space-y-1">
              <Label>Your name</Label>
              <Input
                placeholder="Jane Smith"
                {...register("name", { required: "Name is required" })}
              />
            </div>
            <div className="space-y-1">
              <Label>Email</Label>
              <Input
                type="email"
                placeholder="jane@company.com"
                {...register("email", { required: "Email is required" })}
              />
            </div>
            <div className="space-y-1">
              <Label>Password</Label>
              <Input
                type="password"
                placeholder="••••••••"
                {...register("password", {
                  required: "Password is required",
                  minLength: { value: 8, message: "Min 8 characters" },
                })}
              />
              {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
            </div>
          </div>

          <div className="border-t pt-4 space-y-3">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Select a plan</p>
            <Select onValueChange={(v) => setValue("planId", v as string)}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a plan…" />
              </SelectTrigger>
              <SelectContent>
                {plans?.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name} — ${(p.priceCents / 100).toFixed(2)}/{p.billingInterval.toLowerCase()}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.planId && <p className="text-xs text-destructive">Please select a plan</p>}

            {selectedPlan && (
              <div className="rounded-md border p-3 text-sm space-y-1 bg-muted/40">
                <p className="font-medium">{selectedPlan.name}</p>
                <p className="text-muted-foreground">
                  ${(selectedPlan.priceCents / 100).toFixed(2)} / {selectedPlan.billingInterval.toLowerCase()}
                </p>
                {(selectedPlan.features as string[]).length > 0 && (
                  <ul className="list-disc list-inside text-muted-foreground space-y-0.5">
                    {(selectedPlan.features as string[]).map((f, i) => <li key={i}>{f}</li>)}
                  </ul>
                )}
              </div>
            )}
          </div>

          <Button type="submit" className="w-full" disabled={submit.isPending}>
            {submit.isPending ? "Creating account…" : "Continue to payment"}
          </Button>
          <p className="text-sm text-center text-muted-foreground">
            Already have an account?{" "}
            <Link href="/login" className="underline text-foreground">Sign in</Link>
          </p>
        </form>
      </CardContent>
    </Card>
  );
}
