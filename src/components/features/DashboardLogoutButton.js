"use client";

import { useRouter } from "next/navigation";
import Button from "@/components/ui/Button";
import { useAuth } from "@/hooks/useAuth";

export default function DashboardLogoutButton() {
  const router = useRouter();
  const { logout } = useAuth();

  const handleLogout = () => {
    logout();
    router.replace("/login");
  };

  return (
    <Button
      variant="ghost"
      onClick={handleLogout}
      className="h-9 border-strawberry-red/40 px-4 text-strawberry-red hover:border-strawberry-red"
    >
      Log out
    </Button>
  );
}
