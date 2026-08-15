"use client";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { toast } from "sonner";
import { api, getApiError } from "@/lib/api-client";
import { Organization } from "@/types";
import { StatusBadge } from "@/components/shared/status-badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface OrgWithSub extends Organization {
  subscriptions?: { status: string; plan?: { name: string } }[];
}

export default function OrganizationsPage() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const qc = useQueryClient();

  const { data, isLoading } = useQuery<{ data: OrgWithSub[]; total: number }>({
    queryKey: ["platform", "orgs", search, status],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (status) params.set("status", status);
      return (await api.get(`/platform/organizations?${params}`)).data;
    },
  });

  const suspend = useMutation({
    mutationFn: (id: string) => api.patch(`/platform/organizations/${id}/suspend`),
    onSuccess: () => { toast.success("Organization suspended"); qc.invalidateQueries({ queryKey: ["platform", "orgs"] }); },
    onError: (err) => toast.error(getApiError(err)),
  });

  const reactivate = useMutation({
    mutationFn: (id: string) => api.patch(`/platform/organizations/${id}/reactivate`),
    onSuccess: () => { toast.success("Organization reactivated"); qc.invalidateQueries({ queryKey: ["platform", "orgs"] }); },
    onError: (err) => toast.error(getApiError(err)),
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Organizations</h1>
        {data && (
          <span className="text-sm text-muted-foreground">{data.total} total</span>
        )}
      </div>

      <div className="flex gap-2">
        <Input
          placeholder="Search by name or email…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-xs"
        />
        <select
          className="border rounded-md px-3 py-2 text-sm bg-background"
          value={status}
          onChange={(e) => setStatus(e.target.value)}
        >
          <option value="">All statuses</option>
          {["ACTIVE", "PENDING_PAYMENT", "TRIAL", "SUSPENDED", "CANCELLED"].map((s) => (
            <option key={s} value={s}>{s.replace(/_/g, " ")}</option>
          ))}
        </select>
      </div>

      {isLoading ? (
        <p className="text-muted-foreground">Loading…</p>
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Plan</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Members</TableHead>
                  <TableHead>Signed up</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data?.data.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                      No organizations found.
                    </TableCell>
                  </TableRow>
                )}
                {data?.data.map((org) => (
                  <TableRow key={org.id}>
                    <TableCell>
                      <Link href={`/platform/organizations/${org.id}`} className="font-medium hover:underline">
                        {org.name}
                      </Link>
                      <p className="text-xs text-muted-foreground">{org.billingEmail}</p>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {org.subscriptions?.[0]?.plan?.name ?? "—"}
                    </TableCell>
                    <TableCell><StatusBadge status={org.status} /></TableCell>
                    <TableCell className="text-muted-foreground">{org._count?.users ?? "—"}</TableCell>
                    <TableCell className="text-muted-foreground">{new Date(org.createdAt).toLocaleDateString()}</TableCell>
                    <TableCell>
                      {org.status === "SUSPENDED" ? (
                        <Button size="sm" variant="outline" onClick={() => reactivate.mutate(org.id)} disabled={reactivate.isPending}>
                          Reactivate
                        </Button>
                      ) : org.status === "ACTIVE" ? (
                        <Button size="sm" variant="destructive" onClick={() => suspend.mutate(org.id)} disabled={suspend.isPending}>
                          Suspend
                        </Button>
                      ) : null}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
