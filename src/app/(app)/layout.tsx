import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { SidebarNav } from "@/components/layout/sidebar-nav";
import { UserMenu } from "@/components/layout/user-menu";
import { Logo } from "@/components/layout/logo";

const DEV_BYPASS = process.env.NEXT_PUBLIC_DEV_BYPASS_AUTH === "true";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  let profile = { nombre: "Dev Admin", email: "dev@local" };

  if (!DEV_BYPASS) {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      redirect("/login");
    }

    const { data } = await supabase
      .from("users")
      .select("nombre, email, aprobado")
      .eq("auth_id", user.id)
      .maybeSingle();

    const row = data as
      | { nombre?: string; email?: string; aprobado?: boolean }
      | null;

    // Si no encontramos el row de public.users o no está aprobado → esperando
    if (!row || row.aprobado !== true) {
      redirect("/esperando-aprobacion");
    }

    profile = {
      nombre: row.nombre ?? user.email?.split("@")[0] ?? "Usuario",
      email: row.email ?? user.email ?? "",
    };
  }

  return (
    <div className="flex h-screen bg-background">
      <aside className="flex w-64 flex-col border-r border-border bg-card">
        <div className="border-b border-border p-4">
          <Logo markSize={26} wordmark="SOUL CRM" wordmarkClassName="text-lg" />
        </div>
        <div className="flex-1 overflow-hidden">
          <SidebarNav />
        </div>
        <UserMenu
          email={profile.email}
          nombre={profile.nombre}
          bypass={DEV_BYPASS}
        />
      </aside>
      <main className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-[1600px] p-6 lg:p-8">{children}</div>
      </main>
    </div>
  );
}
