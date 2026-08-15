"use client";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api-client";
import { Payment } from "@/types";
import { StatusBadge } from "@/components/shared/status-badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function BillingPage() {
  const { data, isLoading, isError } = useQuery<{ data: Payment[] }>({
    queryKey: ["org", "payments"],
    queryFn: async () => (await api.get("/org/billing/payments")).data,
  });

  const totalPaid = data?.data
    .filter((p) => p.status === "SUCCESS")
    .reduce((sum, p) => sum + p.amountCents, 0) ?? 0;

  return (
    <div className="space-y-6 max-w-3xl">
      <h1 className="text-xl font-semibold">Billing & Payments</h1>

      {/* Payment method info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Payment Method</CardTitle>
          <CardDescription>
            Payment methods are managed securely via Stripe. No card data is stored on our servers.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertDescription className="text-sm">
              To update your payment method, use the <strong>Subscription</strong> page to start a new checkout session. Your card details are handled entirely by Stripe.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      {/* Summary */}
      {!isLoading && data && data.data.length > 0 && (
        <div className="grid grid-cols-2 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Paid</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">${(totalPaid / 100).toFixed(2)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Payments</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{data.data.length}</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Payment history */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Payment History</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <p className="text-muted-foreground p-4">Loading…</p>
          ) : isError ? (
            <p className="text-destructive p-4">Failed to load payments.</p>
          ) : (
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
                {data?.data.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                      No payments yet.
                    </TableCell>
                  </TableRow>
                )}
                {data?.data.map((p) => (
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
        </CardContent>
      </Card>
    </div>
  );
}
