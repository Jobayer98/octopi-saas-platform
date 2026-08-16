"use client";
import { Suspense, useEffect } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { api, getApiError } from "@/lib/api-client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/shared/status-badge";
import { useAuthStore } from "@/stores/auth";

interface CheckoutStatus {
  organizationId: string;
  orgStatus: string;
  subscription: { status: string } | null;
}

function CheckoutContent() {
  const { orgId } = useParams<{ orgId: string }>();
  const searchParams = useSearchParams();
  const router = useRouter();
  const returnStatus = searchParams.get("status");
  const isLoggedIn = useAuthStore((s) => !!s.user);

  const { data: statusData, refetch } = useQuery<CheckoutStatus>({
    queryKey: ["checkout-status", orgId],
    queryFn: async () => {
      const res = await api.get<CheckoutStatus>(`/checkout/status/${orgId}`);
      return res.data;
    },
    enabled: returnStatus === "success",
    refetchInterval: (q) =>
      q.state.data?.orgStatus === "ACTIVE" ? false : 3000,
  });

  const createSession = useMutation({
    mutationFn: (planId?: string) =>
      api.post<{ url: string }>("/checkout/session", { organizationId: orgId, planId }),
    onSuccess: (res) => {
      window.location.href = (res.data as { url: string }).url;
    },
    onError: (err) => toast.error(getApiError(err)),
  });

  useEffect(() => {
    if (returnStatus === "success") refetch();
  }, [returnStatus, refetch]);

  if (returnStatus === "success") {
    return (
      <Card className="w-full max-w-sm text-center">
        <CardHeader>
          <CardTitle>Payment status</CardTitle>
          <CardDescription>We're confirming your payment with Stripe.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {statusData ? (
            <>
              <StatusBadge status={statusData.orgStatus} />
              {statusData.orgStatus === "ACTIVE" ? (
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">
                    Your organization is active and ready to use.
                  </p>
                  {isLoggedIn ? (
                    <Button className="w-full" onClick={() => router.push("/org/subscription")}>
                      Go to dashboard
                    </Button>
                  ) : (
                    <Link href="/login">
                      <Button className="w-full">Sign in to your account</Button>
                    </Link>
                  )}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Confirming payment… this usually takes a few seconds.
                </p>
              )}
            </>
          ) : (
            <p className="text-sm text-muted-foreground">Checking payment status…</p>
          )}
        </CardContent>
      </Card>
    );
  }

  if (returnStatus === "cancel") {
    return (
      <Card className="w-full max-w-sm text-center">
        <CardHeader>
          <CardTitle>Payment cancelled</CardTitle>
          <CardDescription>Your payment was not completed. You can try again below.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button
            className="w-full"
            onClick={() => createSession.mutate()}
            disabled={createSession.isPending}
          >
            {createSession.isPending ? "Redirecting…" : "Try again"}
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-sm text-center">
      <CardHeader>
        <CardTitle>Complete your registration</CardTitle>
        <CardDescription>
          Click below to proceed to secure checkout and activate your organization.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-xs text-muted-foreground">
          You'll be redirected to Stripe's secure payment page. No card data touches our servers.
        </p>
        <Button
          className="w-full"
          onClick={() => createSession.mutate()}
          disabled={createSession.isPending}
        >
          {createSession.isPending ? "Redirecting to Stripe…" : "Pay & Activate"}
        </Button>
      </CardContent>
    </Card>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={<p className="text-muted-foreground">Loading…</p>}>
      <CheckoutContent />
    </Suspense>
  );
}
