"use client";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api-client";
import { Transaction } from "@/types";
import { StatusBadge } from "@/components/shared/status-badge";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export default function OrgTransactionsPage() {
  const [status, setStatus] = useState("");

  const { data, isLoading } = useQuery<{ data: Transaction[] }>({
    queryKey: ["org", "transactions", status],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (status) params.set("status", status);
      return (await api.get(`/org/transactions?${params}`)).data;
    },
  });

  return (
    <div className="space-y-4 max-w-3xl">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Transactions</h1>
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
                  <TableHead>Type</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data?.data.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                      No transactions yet.
                    </TableCell>
                  </TableRow>
                )}
                {data?.data.map((tx) => (
                  <TableRow key={tx.id}>
                    <TableCell className="font-medium">{tx.type.replace(/_/g, " ")}</TableCell>
                    <TableCell>${(tx.amountCents / 100).toFixed(2)}</TableCell>
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
