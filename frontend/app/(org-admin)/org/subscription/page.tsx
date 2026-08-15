"use client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { api, getApiError } from "@/lib/api-client";
import { Subscription, Plan } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/shared/status-badge";
import { useAuthStore } from "@/stores/auth";

export default function SubscriptionPage() {
  const qc = useQueryClient();
  const router = useRouter();
  const orgId = useAuthStore((s) => s.user?.organizationId);

  // Backend returns raw subscription object
  const { data: sub, isLoading: subLoading } = useQuery<Subscription>({
    queryKey: ["org", "subscription"],
    queryFn: async () => (await api.get("/org/subscription")).data,
  });

  // Backend returns raw array of plans
  const { data: plans } = useQuery<Plan[]>({
    queryKey: ["plans"],
    queryFn: async () => (await api.get("/plans")).data,
  });

  const retryPayment = useMutation({
    mutationFn: async () => {
      const res = await api.post<{ url: string }>("/checkout/session", {
        planId: sub?.planId,
      });
      return res.data;
    },
    onSuccess: (data) => {
      if (orgId) router.push(`/checkout/${orgId}`);
      else window.location.href = data.url;
    },
    onError: (err) => toast.error(getApiError(err)),
  });

  const changePlan = useMutation({
    mutationFn: async (planId: string): Promise<{ url: string }> =>
      (await api.post<{ url: string }>("/org/subscription/upgrade", { planId })).data,
    onSuccess: (data) => { window.location.href = data.url; },
    onError: (err) => toast.error(getApiError(err)),
  });

  const cancel = useMutation({
    mutationFn: () => api.post("/org/subscription/cancel"),
    onSuccess: () => {
      toast.success("Subscription cancelled");
      qc.invalidateQueries({ queryKey: ["org", "subscription"] });
    },
    onError: (err) => toast.error(getApiError(err)),
  });

  if (subLoading) return <p className="text-muted-foreground">Loading…</p>;

  const activePlans = plans?.filter((p) => p.isActive) ?? [];

  return (
    <div className="space-y-6 max-w-lg">
      <h1 className="text-xl font-semibold">Subscription</h1>

      <Card>
        <CardHeader><CardTitle className="text-sm">Current plan</CardTitle></CardHeader>
        <CardContent className="space-y-3 text-sm">
          {sub ? (
            <>
              <p className="font-medium text-base">{sub.plan?.name ?? "—"}</p>
              <StatusBadge status={sub.status} />
              {sub.plan && (
                <p className="text-muted-foreground">
                  ${(sub.plan.priceCents / 100).toFixed(2)} / {sub.plan.billingInterval.toLowerCase()}
                </p>
              )}
              {sub.currentPeriodEnd && (
                <p className="text-muted-foreground">
                  Renews {new Date(sub.currentPeriodEnd).toLocaleDateString()}
                </p>
              )}
              {sub.status === "ACTIVE" && (
                <Button variant="destructive" size="sm" onClick={() => cancel.mutate()} disabled={cancel.isPending}>
                  {cancel.isPending ? "Cancelling…" : "Cancel subscription"}
                </Button>
              )}
              {(sub.status === "PENDING" || sub.status === "FAILED") && (
                <Button size="sm" onClick={() => retryPayment.mutate()} disabled={retryPayment.isPending}>
                  {retryPayment.isPending ? "Redirecting…" : "Complete payment"}
                </Button>
              )}
            </>
          ) : (
            <p className="text-muted-foreground">No active subscription.</p>
          )}
        </CardContent>
      </Card>

      {activePlans.length > 0 && (
        <div>
          <h2 className="font-medium mb-3">Change plan</h2>
          <div className="space-y-2">
            {activePlans.map((plan) => (
              <div key={plan.id} className="flex items-center justify-between border rounded-md px-4 py-3">
                <div>
                  <p className="font-medium text-sm">{plan.name}</p>
                  <p className="text-xs text-muted-foreground">
                    ${(plan.priceCents / 100).toFixed(2)} / {plan.billingInterval.toLowerCase()}
                  </p>
                </div>
                <Button
                  size="sm"
                  variant={sub?.planId === plan.id ? "secondary" : "outline"}
                  disabled={sub?.planId === plan.id || changePlan.isPending}
                  onClick={() => changePlan.mutate(plan.id)}
                >
                  {sub?.planId === plan.id ? "Current" : "Switch"}
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
