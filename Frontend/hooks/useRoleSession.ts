"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { getDashboardPath, readStoredUser } from "@/lib/session";
import type { AppRole, AppUser } from "@/lib/types";

export function useRoleSession(requiredRole?: AppRole) {
  const router = useRouter();
  const [user, setUser] = useState<AppUser | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const storedUser = readStoredUser();

    if (!storedUser) {
      router.replace("/auth");
      setReady(true);
      return;
    }

    if (requiredRole && storedUser.role !== requiredRole) {
      router.replace(getDashboardPath(storedUser.role));
      setReady(true);
      return;
    }

    setUser(storedUser);
    setReady(true);
  }, [requiredRole, router]);

  return { user, ready, setUser };
}
