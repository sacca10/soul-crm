"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";

interface UserMenuProps {
  email: string;
  nombre?: string;
  bypass?: boolean;
}

export function UserMenu({ email, nombre, bypass = false }: UserMenuProps) {
  const router = useRouter();

  async function handleSignOut() {
    if (bypass) return;
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  const display = nombre || email.split("@")[0];

  return (
    <div className="flex items-center gap-3 border-t border-border p-3">
      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[linear-gradient(135deg,#c46bff_0%,#9b6dff_50%,#6d28d9_100%)] text-sm font-bold text-[hsl(var(--primary-foreground))] shadow-[inset_0_1px_0_rgba(255,255,255,0.25)]">
        {display.slice(0, 1).toUpperCase()}
      </div>
      <div className="flex-1 overflow-hidden">
        <div className="truncate text-sm font-medium">{display}</div>
        <div className="truncate text-xs text-muted-foreground">{email}</div>
      </div>
      {!bypass && (
        <Button
          variant="ghost"
          size="icon"
          onClick={handleSignOut}
          aria-label="Cerrar sesión"
        >
          <LogOut className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
}
