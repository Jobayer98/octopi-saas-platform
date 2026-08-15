"use client";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api-client";
import { Transaction } from "@/types";
import { StatusBadge } from "@/components/shared/status-badge";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export default function PlatformTransactionsPage() {
  const [status, setStatus] = useState("");
  const [search, setSearch] = useState("");

  const { data, isLoading } = useQuery<{ data: Transaction[] }>({
    queryKey: ["platform", "transactions", status, search],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (status) params.set("status", status);
      if (search) params.set("search", search);
      return (await api.get(`/platform/transactions?${params}`)).data;
    },
  });

  const total = data?.data.reduce((sum, tx) => sum + (tx.status === "SUCCESS" ? tx.amountCents : 0), 0) ?? 0;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Transactions</h1>
        {data && (
          <span className="text-sm text-muted-foreground">
            {data.data.length} records · ${(total / 100).toFixed(2)} successful
          </span>
        )}
      </div>

      <div className="flex gap-2">
        <Input
          placeholder="Search organization…"
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
          {["PENDING", "SUCCESS", "FAILED", "REFUNDED", "ROLLED_BACK"].map((s) => (
            <option key={s} value={s}>{s}</option>
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
                  <TableHead>Organization</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data?.data.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                      No transactions found.
                    </TableCell>
                  </TableRow>
                )}
                {data?.data.map((tx) => (
                  <TableRow key={tx.id}>
                    <TableCell className="font-medium">{tx.organization?.name ?? tx.organizationId}</TableCell>
                    <TableCell className="text-muted-foreground">{tx.type.replace(/_/g, " ")}</TableCell>
                    <TableCell className="font-medium">${(tx.amountCents / 100).toFixed(2)}</TableCell>
                    <TableCell><StatusBadge status={tx.status} /></TableCell>
                    <TableCell className="text-muted-foreground">{new Date(tx.createdAt).toLocaleDateString()}</TableCell>
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
