"use client";

import { useRouter } from "next/navigation";

import { api } from "@/lib/client";

export function LogoutButton() {
  const router = useRouter();
  return (
    <button
      type="button"
      className="link-button"
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
