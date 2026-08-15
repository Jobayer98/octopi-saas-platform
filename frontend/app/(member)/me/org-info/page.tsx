"use client";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api-client";
import { Organization } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/shared/status-badge";

export default function OrgInfoPage() {
  const { data, isLoading, isError } = useQuery<Organization>({
    queryKey: ["org", "profile"],
    queryFn: async () => (await api.get("/org/profile")).data,
  });

  if (isLoading) return <p className="text-muted-foreground">Loading…</p>;
  if (isError || !data) return <p className="text-destructive">Failed to load org info.</p>;

  const org = data;

  return (
    <div className="space-y-4 max-w-md">
      <h1 className="text-xl font-semibold">Organization Info</h1>
      <Card>
        <CardHeader><CardTitle className="text-sm">Details</CardTitle></CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Name</span>
            <span className="font-medium">{org.name}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Status</span>
            <StatusBadge status={org.status} />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Member since</span>
            <span>{new Date(org.createdAt).toLocaleDateString()}</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
