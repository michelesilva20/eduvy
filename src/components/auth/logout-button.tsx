"use client";

import { useState } from "react";
import { LogOut } from "lucide-react";
import { cn } from "@/lib/utils";

interface LogoutButtonProps {
  className?: string;
  title?: string;
  variant?: "icon" | "menu";
}

export function LogoutButton({
  className,
  title = "Sair",
  variant = "icon",
}: LogoutButtonProps) {
  const [loading, setLoading] = useState(false);

  const handleLogout = async () => {
    setLoading(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } finally {
      window.location.href = "/login";
    }
  };

  if (variant === "menu") {
    return (
      <button
        type="button"
        disabled={loading}
        onClick={handleLogout}
        className={cn(
          "focus-ring flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-text-dark hover:bg-background-light disabled:opacity-60",
          className,
        )}
      >
        <LogOut className="size-4" aria-hidden />
        {loading ? "Saindo…" : title}
      </button>
    );
  }

  return (
    <button
      type="button"
      title={title}
      disabled={loading}
      onClick={handleLogout}
      className={cn(
        "focus-ring inline-flex size-9 items-center justify-center rounded-lg text-text-muted hover:bg-background-light hover:text-text-dark disabled:opacity-60",
        className,
      )}
      aria-label={title}
    >
      <LogOut className="size-4" aria-hidden />
    </button>
  );
}
