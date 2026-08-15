"use client";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { api } from "@/lib/api-client";
import { Organization } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/shared/status-badge";

interface Stats {
  totalOrgs: number;
  activeOrgs: number;
  totalUsers: number;
  activeSubscriptions: number;
  totalRevenueCents: number;
  failedPayments: number;
}

function StatCard({ title, value, sub }: { title: string; value: string | number; sub?: string }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-2xl font-bold">{value}</p>
        {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
      </CardContent>
    </Card>
  );
}

export default function PlatformDashboard() {
  const { data: stats, isLoading: statsLoading, isError } = useQuery<Stats>({
    queryKey: ["platform", "stats"],
    queryFn: async () => (await api.get("/platform/stats")).data,
  });

  const { data: recentOrgs } = useQuery<{ data: Organization[] }>({
    queryKey: ["platform", "orgs", "", "", 1, 5],
    queryFn: async () => (await api.get("/platform/organizations?limit=5&page=1")).data,
  });

  if (statsLoading) return <p className="text-muted-foreground">Loading…</p>;
  if (isError || !stats) return <p className="text-destructive">Failed to load stats.</p>;

  return (
    <div className="space-y-8">
      <h1 className="text-xl font-semibold">Overview</h1>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <StatCard title="Total Organizations" value={stats.totalOrgs} />
        <StatCard title="Active Organizations" value={stats.activeOrgs} sub={`${stats.totalOrgs - stats.activeOrgs} inactive`} />
        <StatCard title="Total Users" value={stats.totalUsers} />
        <StatCard title="Active Subscriptions" value={stats.activeSubscriptions} />
        <StatCard
          title="Total Revenue"
          value={`$${(stats.totalRevenueCents / 100).toFixed(2)}`}
        />
        <StatCard
          title="Failed Payments"
          value={stats.failedPayments}
          sub={stats.failedPayments > 0 ? "Needs attention" : "All clear"}
        />
      </div>

      <div>
        <h2 className="font-medium mb-3 text-sm text-muted-foreground uppercase tracking-wide">Recent Signups</h2>
        <Card>
          <CardContent className="p-0">
            {!recentOrgs || recentOrgs.data.length === 0 ? (
              <p className="text-muted-foreground text-sm p-4">No organizations yet.</p>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Organization</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Status</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Members</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Joined</th>
                  </tr>
                </thead>
                <tbody>
                  {recentOrgs.data.map((org) => (
                    <tr key={org.id} className="border-b last:border-0 hover:bg-muted/40 transition-colors">
                      <td className="px-4 py-3">
                        <Link href={`/platform/organizations/${org.id}`} className="font-medium hover:underline">
                          {org.name}
                        </Link>
                      </td>
                      <td className="px-4 py-3"><StatusBadge status={org.status} /></td>
                      <td className="px-4 py-3 text-muted-foreground">{org._count?.users ?? "—"}</td>
                      <td className="px-4 py-3 text-muted-foreground">{new Date(org.createdAt).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </CardContent>
        </Card>
        <div className="mt-2 text-right">
          <Link href="/platform/organizations" className="text-xs text-muted-foreground hover:underline">
            View all organizations →
          </Link>
        </div>
      </div>
    </div>
  );
}
