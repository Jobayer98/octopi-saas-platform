"use client";
import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { api } from "@/lib/api-client";
import { useAuthStore } from "@/stores/auth";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import Cookies from "js-cookie";

const roleLabel: Record<string, string> = {
  PLATFORM_ADMIN: "Platform Admin",
  ORG_ADMIN: "Org Admin",
  ORG_MEMBER: "Member",
};

export function TopBar() {
  const router = useRouter();
  const { user, clearAuth } = useAuthStore();

  const logout = useMutation({
    mutationFn: () => api.post("/auth/logout"),
    onSettled: () => {
      clearAuth();
      Cookies.remove("role");
      router.push("/login");
    },
  });

  return (
    <header className="h-14 border-b flex items-center justify-between px-6 shrink-0 bg-background">
      <span className="font-semibold text-sm tracking-tight">Octopi Platform</span>
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button variant="ghost" className="flex items-center gap-2 h-9 px-2" />
          }
        >
            <Avatar className="h-7 w-7">
              <AvatarFallback className="text-xs">
                {user?.name?.[0]?.toUpperCase() ?? "U"}
              </AvatarFallback>
            </Avatar>
            <div className="text-left hidden sm:block">
              <p className="text-sm font-medium leading-none">{user?.name ?? "—"}</p>
              <p className="text-xs text-muted-foreground leading-none mt-0.5">
                {user?.role ? roleLabel[user.role] : ""}
              </p>
            </div>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuGroup>
            <DropdownMenuLabel className="font-normal">
              <p className="text-sm font-medium">{user?.name}</p>
              <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
            </DropdownMenuLabel>
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            className="text-destructive focus:text-destructive cursor-pointer"
            onClick={() => logout.mutate()}
            disabled={logout.isPending}
          >
            {logout.isPending ? "Signing out…" : "Sign out"}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}
