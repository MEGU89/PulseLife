"use client";

import type { AppRole, AppUser } from "@/lib/types";

const ROLE_LABELS: Record<AppRole, string> = {
  donor: "Donor",
  hospital: "Hospital",
  recipient: "Recipient",
};

export function isAppRole(value: string | null | undefined): value is AppRole {
  return value === "donor" || value === "hospital" || value === "recipient";
}

export function readStoredUser(): AppUser | null {
  if (typeof window === "undefined") return null;

  const rawUser = window.localStorage.getItem("user");
  if (!rawUser) return null;

  try {
    const parsed = JSON.parse(rawUser) as AppUser;
    if (!parsed?.role || !isAppRole(parsed.role)) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function readStoredUserId(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem("userId");
}

export function saveStoredSession(user: AppUser, token?: string | null) {
  if (typeof window === "undefined") return;

  window.localStorage.setItem("user", JSON.stringify(user));
  window.localStorage.setItem("role", user.role);

  const resolvedId = user.id || user._id;
  if (resolvedId) {
    window.localStorage.setItem("userId", resolvedId);
  }

  if (token) {
    window.localStorage.setItem("token", token);
  }
}

export function clearStoredSession() {
  if (typeof window === "undefined") return;

  window.localStorage.removeItem("token");
  window.localStorage.removeItem("userId");
  window.localStorage.removeItem("role");
  window.localStorage.removeItem("user");
  window.localStorage.removeItem("locationSharing");
  window.localStorage.removeItem("available");
}

export function getDashboardPath(role: AppRole) {
  return role === "donor"
    ? "/donor/dashboard"
    : role === "hospital"
      ? "/hospital/dashboard"
      : "/recipient/dashboard";
}

export function getProfilePath(role: AppRole) {
  return role === "donor"
    ? "/donor/profile"
    : role === "hospital"
      ? "/hospital/profile"
      : "/recipient/profile";
}

export function getRoleLabel(role: AppRole) {
  return ROLE_LABELS[role];
}
