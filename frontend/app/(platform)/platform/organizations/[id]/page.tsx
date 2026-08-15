"use client";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import { toast } from "sonner";
import { api, getApiError } from "@/lib/api-client";
import { Organization, User, Subscription, Payment, Transaction } from "@/types";
import { StatusBadge } from "@/components/shared/status-badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface OrgDetail {
  organization: Organization & {
    users: User[];
    subscriptions: (Subscription & { plan?: { name: string } })[];
    payments: Payment[];
  };
}

type Tab = "overview" | "members" | "subscriptions" | "payments" | "transactions";

export default function OrgDetailPage() {
  const { id } = useParams<{ id: string }>();
  const qc = useQueryClient();
  const [tab, setTab] = useState<Tab>("overview");

  const { data, isLoading, isError } = useQuery<OrgDetail>({
    queryKey: ["platform", "org", id],
    queryFn: async () => (await api.get(`/platform/organizations/${id}`)).data,
  });

  const { data: txData } = useQuery<{ data: Transaction[] }>({
    queryKey: ["platform", "org", id, "transactions"],
    queryFn: async () => (await api.get(`/platform/transactions?organizationId=${id}`)).data,
    enabled: tab === "transactions",
  });

  const suspend = useMutation({
    mutationFn: () => api.patch(`/platform/organizations/${id}/suspend`),
    onSuccess: () => { toast.success("Organization suspended"); qc.invalidateQueries({ queryKey: ["platform", "org", id] }); },
    onError: (err) => toast.error(getApiError(err)),
  });

  const reactivate = useMutation({
    mutationFn: () => api.patch(`/platform/organizations/${id}/reactivate`),
    onSuccess: () => { toast.success("Organization reactivated"); qc.invalidateQueries({ queryKey: ["platform", "org", id] }); },
    onError: (err) => toast.error(getApiError(err)),
  });

  if (isLoading) return <p className="text-muted-foreground">Loading…</p>;
  if (isError || !data) return <p className="text-destructive">Failed to load organization.</p>;

  const { organization: org } = data;
  const activeSub = org.subscriptions[0];

  const tabs: { key: Tab; label: string }[] = [
    { key: "overview", label: "Overview" },
    { key: "members", label: `Members (${org.users.length})` },
    { key: "subscriptions", label: "Subscriptions" },
    { key: "payments", label: "Payments" },
    { key: "transactions", label: "Transactions" },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <h1 className="text-xl font-semibold">{org.name}</h1>
          <div className="flex items-center gap-2">
            <StatusBadge status={org.status} />
            <span className="text-xs text-muted-foreground">
              Joined {new Date(org.createdAt).toLocaleDateString()}
            </span>
          </div>
        </div>
        <div>
          {org.status === "SUSPENDED" ? (
            <Button size="sm" variant="outline" onClick={() => reactivate.mutate()} disabled={reactivate.isPending}>
              Reactivate
            </Button>
          ) : org.status === "ACTIVE" ? (
            <Button size="sm" variant="destructive" onClick={() => suspend.mutate()} disabled={suspend.isPending}>
              Suspend
            </Button>
          ) : null}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              tab === t.key
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Overview */}
      {tab === "overview" && (
        <div className="grid md:grid-cols-2 gap-4">
          <Card>
            <CardHeader><CardTitle className="text-sm">Profile</CardTitle></CardHeader>
            <CardContent className="text-sm space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Billing email</span>
                <span>{org.billingEmail}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Members</span>
                <span>{org.users.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Created</span>
                <span>{new Date(org.createdAt).toLocaleDateString()}</span>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle className="text-sm">Current Subscription</CardTitle></CardHeader>
            <CardContent className="text-sm space-y-2">
              {activeSub ? (
                <>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Plan</span>
                    <span className="font-medium">{activeSub.plan?.name ?? "—"}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Status</span>
                    <StatusBadge status={activeSub.status} />
                  </div>
                  {activeSub.currentPeriodEnd && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Renews</span>
                      <span>{new Date(activeSub.currentPeriodEnd).toLocaleDateString()}</span>
                    </div>
                  )}
                </>
              ) : (
                <p className="text-muted-foreground">No subscription</p>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Members */}
      {tab === "members" && (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {org.users.length === 0 && (
              <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground">No members.</TableCell></TableRow>
            )}
            {org.users.map((u) => (
              <TableRow key={u.id}>
                <TableCell className="font-medium">{u.name}</TableCell>
                <TableCell className="text-muted-foreground">{u.email}</TableCell>
                <TableCell><Badge variant="outline">{u.role}</Badge></TableCell>
                <TableCell><StatusBadge status={u.status} /></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      {/* Subscriptions */}
      {tab === "subscriptions" && (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Plan</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Period Start</TableHead>
              <TableHead>Period End</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {org.subscriptions.length === 0 && (
              <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground">No subscriptions.</TableCell></TableRow>
            )}
            {org.subscriptions.map((s) => (
              <TableRow key={s.id}>
                <TableCell className="font-medium">{s.plan?.name ?? "—"}</TableCell>
                <TableCell><StatusBadge status={s.status} /></TableCell>
                <TableCell className="text-muted-foreground">
                  {s.currentPeriodStart ? new Date(s.currentPeriodStart).toLocaleDateString() : "—"}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {s.currentPeriodEnd ? new Date(s.currentPeriodEnd).toLocaleDateString() : "—"}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      {/* Payments */}
      {tab === "payments" && (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Amount</TableHead>
              <TableHead>Currency</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Failure reason</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {org.payments.length === 0 && (
              <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground">No payments.</TableCell></TableRow>
            )}
            {org.payments.map((p) => (
              <TableRow key={p.id}>
                <TableCell className="font-medium">${(p.amountCents / 100).toFixed(2)}</TableCell>
                <TableCell className="uppercase text-muted-foreground">{p.currency}</TableCell>
                <TableCell><StatusBadge status={p.status} /></TableCell>
                <TableCell className="text-muted-foreground">{new Date(p.createdAt).toLocaleDateString()}</TableCell>
                <TableCell className="text-muted-foreground text-sm">{p.failureReason ?? "—"}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      {/* Transactions */}
      {tab === "transactions" && (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Type</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Date</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {!txData || txData.data.length === 0 ? (
              <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground">No transactions.</TableCell></TableRow>
            ) : (
              txData.data.map((tx) => (
                <TableRow key={tx.id}>
                  <TableCell className="font-medium">{tx.type.replace(/_/g, " ")}</TableCell>
                  <TableCell>${(tx.amountCents / 100).toFixed(2)}</TableCell>
                  <TableCell><StatusBadge status={tx.status} /></TableCell>
                  <TableCell className="text-muted-foreground">{new Date(tx.createdAt).toLocaleDateString()}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
