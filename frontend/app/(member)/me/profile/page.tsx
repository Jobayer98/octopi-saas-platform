"use client";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { useQuery, useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { api, getApiError } from "@/lib/api-client";
import { User } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

interface ProfileForm { name: string; email: string }
interface PasswordForm { currentPassword: string; newPassword: string }

export default function MemberProfilePage() {
  const { data, isLoading } = useQuery<User>({
    queryKey: ["me", "profile"],
    queryFn: async () => (await api.get("/me/profile")).data,
  });

  const { register: regProfile, handleSubmit: handleProfile, reset } = useForm<ProfileForm>();
  const { register: regPwd, handleSubmit: handlePwd, reset: resetPwd } = useForm<PasswordForm>();

  useEffect(() => {
    if (data) reset({ name: data.name, email: data.email });
  }, [data, reset]);

  const updateProfile = useMutation({
    mutationFn: (body: ProfileForm) => api.patch("/me/profile", body),
    onSuccess: () => toast.success("Profile updated"),
    onError: (err) => toast.error(getApiError(err)),
  });

  const changePassword = useMutation({
    mutationFn: (body: PasswordForm) => api.patch("/me/password", body),
    onSuccess: () => { toast.success("Password changed"); resetPwd(); },
    onError: (err) => toast.error(getApiError(err)),
  });

  if (isLoading) return <p className="text-muted-foreground">Loading…</p>;

  return (
    <div className="space-y-6 max-w-md">
      <h1 className="text-xl font-semibold">My Profile</h1>

      <Card>
        <CardHeader><CardTitle className="text-sm">Account details</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={handleProfile((d) => updateProfile.mutate(d))} className="space-y-4">
            <div className="space-y-1"><Label>Name</Label><Input {...regProfile("name", { required: true })} /></div>
            <div className="space-y-1"><Label>Email</Label><Input type="email" {...regProfile("email", { required: true })} /></div>
            <Button type="submit" disabled={updateProfile.isPending}>
              {updateProfile.isPending ? "Saving…" : "Save"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-sm">Change password</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={handlePwd((d) => changePassword.mutate(d))} className="space-y-4">
            <div className="space-y-1"><Label>Current password</Label><Input type="password" {...regPwd("currentPassword", { required: true })} /></div>
            <div className="space-y-1"><Label>New password</Label><Input type="password" {...regPwd("newPassword", { required: true, minLength: 8 })} /></div>
            <Button type="submit" disabled={changePassword.isPending}>
              {changePassword.isPending ? "Saving…" : "Change password"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
