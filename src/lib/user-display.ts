import type { User } from "@/lib/auth-store";

export function getDisplayName(user: User | null | undefined): string {
  if (!user) return "";
  if (user.name && user.name.trim()) return user.name.trim();
  return user.email.split("@")[0];
}

export function getFirstName(user: User | null | undefined): string {
  if (!user) return "";
  if (user.name && user.name.trim()) return user.name.trim().split(/\s+/)[0];
  return user.email.split("@")[0];
}

export function getInitials(user: User | null | undefined): string {
  const display = getDisplayName(user);
  if (!display) return "U";
  return display
    .split(/\s+/)
    .map((w) => w[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}
