"use client";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { api, getApiError } from "@/lib/api-client";
import { User } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface InviteForm {
  email: string;
  role: "ORG_ADMIN" | "ORG_MEMBER";
}

export default function MembersPage() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors },
  } = useForm<InviteForm>({
    defaultValues: { role: "ORG_MEMBER" },
  });

  const { data, isLoading } = useQuery<User[]>({
    queryKey: ["org", "members"],
    queryFn: async () => (await api.get("/org/members")).data,
  });

  const invite = useMutation({
    mutationFn: (body: InviteForm) => api.post("/org/members/invite", body),
    onSuccess: () => {
      toast.success(
        "Invite sent — they'll receive an email with a link to join.",
      );
      qc.invalidateQueries({ queryKey: ["org", "members"] });
      reset();
      setOpen(false);
    },
    onError: (err) => toast.error(getApiError(err)),
  });

  const changeRole = useMutation({
    mutationFn: ({ userId, role }: { userId: string; role: string }) =>
      api.patch(`/org/members/${userId}/role`, { role }),
    onSuccess: () => {
      toast.success("Role updated");
      qc.invalidateQueries({ queryKey: ["org", "members"] });
    },
    onError: (err) => toast.error(getApiError(err)),
  });

  const remove = useMutation({
    mutationFn: (userId: string) => api.delete(`/org/members/${userId}`),
    onSuccess: () => {
      toast.success("Member removed");
      qc.invalidateQueries({ queryKey: ["org", "members"] });
    },
    onError: (err) => toast.error(getApiError(err)),
  });

  return (
    <div className="space-y-4 max-w-4xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Members</h1>
          {data && (
            <p className="text-sm text-muted-foreground">
              {data.length} member{data.length !== 1 ? "s" : ""}
            </p>
          )}
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger render={<Button />}>Invite member</DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Invite a new member</DialogTitle>
            </DialogHeader>
            <p className="text-sm text-muted-foreground">
              They&apos;ll receive an email with a link to create their account
              and join your organization.
            </p>
            <form
              onSubmit={handleSubmit((d) => invite.mutate(d))}
              className="space-y-4 mt-2"
            >
              <div className="space-y-1">
                <Label>Email address</Label>
                <Input
                  type="email"
                  placeholder="colleague@company.com"
                  {...register("email", { required: "Email is required" })}
                />
                {errors.email && (
                  <p className="text-xs text-destructive">
                    {errors.email.message}
                  </p>
                )}
              </div>
              <div className="space-y-1">
                <Label>Role</Label>
                <Select
                  defaultValue="ORG_MEMBER"
                  onValueChange={(v) =>
                    setValue("role", v as InviteForm["role"])
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ORG_MEMBER">
                      Member — can view org info and their profile
                    </SelectItem>
                    <SelectItem value="ORG_ADMIN">
                      Admin — full access to billing, members, subscription
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button
                type="submit"
                className="w-full"
                disabled={invite.isPending}
              >
                {invite.isPending ? "Sending invite…" : "Send invite"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <p className="text-muted-foreground">Loading…</p>
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data?.length === 0 && (
                  <TableRow>
                    <TableCell
                      colSpan={5}
                      className="text-center text-muted-foreground py-8"
                    >
                      No members yet. Invite someone to get started.
                    </TableCell>
                  </TableRow>
                )}
                {data?.map((m) => (
                  <TableRow key={m.id}>
                    <TableCell className="font-medium">
                      {m.name ?? ""}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {m.email}
                    </TableCell>
                    <TableCell>
                      <Select
                        defaultValue={m.role}
                        onValueChange={(v) =>
                          changeRole.mutate({ userId: m.id, role: v })
                        }
                      >
                        <SelectTrigger className="w-32 h-8 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="ORG_MEMBER">Member</SelectItem>
                          <SelectItem value="ORG_ADMIN">Admin</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          m.status === "ACTIVE" ? "default" : "secondary"
                        }
                      >
                        {m.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
                        onClick={() => remove.mutate(m.id)}
                        disabled={remove.isPending}
                      >
                        Remove
                      </Button>
                    </TableCell>
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
