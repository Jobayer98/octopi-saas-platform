import { Badge } from "@/components/ui/badge";

const statusVariant: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  ACTIVE: "default",
  PENDING: "secondary",
  PENDING_PAYMENT: "secondary",
  TRIAL: "outline",
  SUSPENDED: "destructive",
  CANCELLED: "destructive",
  FAILED: "destructive",
  EXPIRED: "destructive",
  SUCCESS: "default",
  REFUNDED: "outline",
  ROLLED_BACK: "destructive",
};

export function StatusBadge({ status }: { status: string }) {
  return (
    <Badge variant={statusVariant[status] ?? "secondary"}>
      {status.replace(/_/g, " ")}
    </Badge>
  );
}
