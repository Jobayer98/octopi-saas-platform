"use client";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { api, getApiError } from "@/lib/api-client";
import { Organization } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

interface ProfileForm { name: string; billingEmail: string }

export default function OrgProfilePage() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery<Organization>({
    queryKey: ["org", "profile"],
    queryFn: async () => (await api.get("/org/profile")).data,
  });

  const { register, handleSubmit, reset } = useForm<ProfileForm>();

  useEffect(() => {
    if (data) {
      reset({ name: data.name, billingEmail: data.billingEmail });
    }
  }, [data, reset]);

  const update = useMutation({
    mutationFn: (body: ProfileForm) => api.patch("/org/profile", body),
    onSuccess: () => { toast.success("Profile updated"); qc.invalidateQueries({ queryKey: ["org", "profile"] }); },
    onError: (err) => toast.error(getApiError(err)),
  });

  if (isLoading) return <p className="text-muted-foreground">Loading…</p>;

  return (
    <div className="space-y-4 max-w-md">
      <h1 className="text-xl font-semibold">Organization Profile</h1>
      <Card>
        <CardHeader><CardTitle className="text-sm">Details</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit((d) => update.mutate(d))} className="space-y-4">
            <div className="space-y-1"><Label>Organization name</Label><Input {...register("name", { required: true })} /></div>
            <div className="space-y-1"><Label>Billing email</Label><Input type="email" {...register("billingEmail", { required: true })} /></div>
            <Button type="submit" disabled={update.isPending}>{update.isPending ? "Saving…" : "Save"}</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
