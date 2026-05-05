"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

import { LoadingView } from "@/components/app-ui";
import { getProfilePath, readStoredUser } from "@/lib/session";

export default function ProfilePage() {
  const router = useRouter();

  useEffect(() => {
    const user = readStoredUser();

    if (!user) {
      router.replace("/auth");
      return;
    }

    router.replace(getProfilePath(user.role));
  }, [router]);

  return <LoadingView label="Opening your profile..." />;
}
