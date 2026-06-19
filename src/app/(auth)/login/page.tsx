import { LoginForm } from "./login-form";
import { Logo } from "@/components/layout/logo";

export default function LoginPage() {
  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-background">
      {/* Imagen de fondo (public/bg.png) */}
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: "url('/bg.png')" }}
        aria-hidden
      />

      <div className="relative flex min-h-screen items-center justify-center p-4">
        <div className="w-full max-w-sm">
          <div className="mb-8 flex flex-col items-center text-center">
            <Logo markSize={56} wordmarkClassName="text-3xl" className="mb-5 flex-col gap-3" />
            <div className="text-xs uppercase tracking-[0.3em] text-[hsl(var(--gold-light))]">
              Acceso al sistema
            </div>
            <h2 className="mt-1 text-2xl font-bold tracking-tight">
              Ingresá a tu cuenta
            </h2>
          </div>
          <LoginForm />
        </div>
      </div>
    </div>
  );
}
