"use client";

import { useRouter } from "next/navigation";

import { api } from "@/lib/client";

export function LogoutButton({ className = "link-button" }: { className?: string }) {
  const router = useRouter();
  return (
    <button
      type="button"
      className={className}
      onClick={async () => {
        await api("/api/auth/logout", { method: "POST" });
        router.push("/");
        router.refresh();
      }}
    >
      Log out
    </button>
  );
}
