"use client";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { api, getApiError } from "@/lib/api-client";
import { Plan } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface PlanForm {
  name: string;
  priceCents: number;
  billingInterval: "MONTHLY" | "YEARLY";
  features: string;
}

function PlanFormFields({ plan, onClose }: { plan?: Plan; onClose: () => void }) {
  const qc = useQueryClient();
  const { register, handleSubmit, setValue } = useForm<PlanForm>({
    defaultValues: plan
      ? { name: plan.name, priceCents: plan.priceCents, billingInterval: plan.billingInterval, features: (plan.features as string[]).join(", ") }
      : { billingInterval: "MONTHLY" },
  });

  const save = useMutation({
    mutationFn: (data: PlanForm) => {
      const body = { ...data, features: data.features.split(",").map((f) => f.trim()).filter(Boolean) };
      return plan ? api.patch(`/plans/${plan.id}`, body) : api.post("/plans", body);
    },
    onSuccess: () => {
      toast.success(plan ? "Plan updated" : "Plan created");
      qc.invalidateQueries({ queryKey: ["plans"] });
      onClose();
    },
    onError: (err) => toast.error(getApiError(err)),
  });

  return (
    <form onSubmit={handleSubmit((d) => save.mutate(d))} className="space-y-4">
      <div className="space-y-1"><Label>Name</Label><Input {...register("name", { required: true })} /></div>
      <div className="space-y-1"><Label>Price (cents)</Label><Input type="number" {...register("priceCents", { required: true, valueAsNumber: true })} /></div>
      <div className="space-y-1">
        <Label>Billing interval</Label>
        <Select defaultValue={plan?.billingInterval ?? "MONTHLY"} onValueChange={(v) => setValue("billingInterval", v as "MONTHLY" | "YEARLY")}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="MONTHLY">Monthly</SelectItem>
            <SelectItem value="YEARLY">Yearly</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-1"><Label>Features (comma-separated)</Label><Input {...register("features")} /></div>
      <Button type="submit" disabled={save.isPending}>{save.isPending ? "Saving…" : "Save"}</Button>
    </form>
  );
}

export default function PlansPage() {
  const qc = useQueryClient();
  const [createOpen, setCreateOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<Plan | null>(null);

  const { data, isLoading } = useQuery<Plan[]>({
    queryKey: ["plans"],
    queryFn: async () => (await api.get("/plans")).data,
  });

  const disable = useMutation({
    mutationFn: (id: string) => api.patch(`/plans/${id}/disable`),
    onSuccess: () => { toast.success("Plan disabled"); qc.invalidateQueries({ queryKey: ["plans"] }); },
    onError: (err) => toast.error(getApiError(err)),
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Plans</h1>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger>
            <Button>New plan</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Create plan</DialogTitle></DialogHeader>
            <PlanFormFields onClose={() => setCreateOpen(false)} />
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? <p className="text-muted-foreground">Loading…</p> : (
        <>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Interval</TableHead>
                <TableHead>Status</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data?.map((plan) => (
                <TableRow key={plan.id}>
                  <TableCell>{plan.name}</TableCell>
                  <TableCell>${(plan.priceCents / 100).toFixed(2)}</TableCell>
                  <TableCell>{plan.billingInterval}</TableCell>
                  <TableCell>
                    <Badge variant={plan.isActive ? "default" : "secondary"}>
                      {plan.isActive ? "Active" : "Disabled"}
                    </Badge>
                  </TableCell>
                  <TableCell className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => setEditingPlan(plan)}>Edit</Button>
                    {plan.isActive && (
                      <Button size="sm" variant="destructive" onClick={() => disable.mutate(plan.id)}>Disable</Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          <Dialog open={!!editingPlan} onOpenChange={(o) => { if (!o) setEditingPlan(null); }}>
            <DialogContent>
              <DialogHeader><DialogTitle>Edit plan</DialogTitle></DialogHeader>
              {editingPlan && <PlanFormFields plan={editingPlan} onClose={() => setEditingPlan(null)} />}
            </DialogContent>
          </Dialog>
        </>
      )}
    </div>
  );
}
