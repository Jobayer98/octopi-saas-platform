"use client";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { api } from "@/lib/api-client";
import { Organization, Subscription, Payment } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";

export default function OrgDashboard() {
  const { data: org } = useQuery<Organization>({
    queryKey: ["org", "profile"],
    queryFn: async () => (await api.get("/org/profile")).data,
  });

  const { data: sub } = useQuery<Subscription>({
    queryKey: ["org", "subscription"],
    queryFn: async () => (await api.get("/org/subscription")).data,
  });

  const { data: payments } = useQuery<{ data: Payment[] }>({
    queryKey: ["org", "payments"],
    queryFn: async () => (await api.get("/org/billing/payments")).data,
  });

  const lastPayment = payments?.data?.[0];

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold">Dashboard</h1>

      <div className="grid md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Organization</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="font-semibold">{org?.name ?? "—"}</p>
            {org && <StatusBadge status={org.status} />}
            <Link href="/org/profile">
              <Button variant="link" className="p-0 h-auto text-xs">Edit profile →</Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Subscription</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {sub ? (
              <>
                <p className="font-semibold">{sub.plan?.name ?? "—"}</p>
                <StatusBadge status={sub.status} />
                {sub.currentPeriodEnd && (
                  <p className="text-xs text-muted-foreground">
                    Renews {new Date(sub.currentPeriodEnd).toLocaleDateString()}
                  </p>
                )}
              </>
            ) : (
              <p className="text-muted-foreground text-sm">No active subscription</p>
            )}
            <Link href="/org/subscription">
              <Button variant="link" className="p-0 h-auto text-xs">Manage →</Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Last Payment</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {lastPayment ? (
              <>
                <p className="font-semibold">${(lastPayment.amountCents / 100).toFixed(2)}</p>
                <StatusBadge status={lastPayment.status} />
                <p className="text-xs text-muted-foreground">
                  {new Date(lastPayment.createdAt).toLocaleDateString()}
                </p>
              </>
            ) : (
              <p className="text-muted-foreground text-sm">No payments yet</p>
            )}
            <Link href="/org/billing">
              <Button variant="link" className="p-0 h-auto text-xs">View billing →</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
