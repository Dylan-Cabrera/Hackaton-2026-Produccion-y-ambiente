import { useEffect } from "react";
import LoginForm from "@/components/LoginForm";

export default function LoginPage() {
  useEffect(() => {
    document.title = "Ingresar · Mercado Km 0";
  }, []);

  return (
    <main className="mx-auto max-w-sm space-y-6 px-4 py-12">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Ingresá a tu cuenta</h1>
        <p className="mt-1 text-muted-foreground">
          Con el email y la contraseña que usaste al registrarte como productor.
        </p>
      </div>
      <LoginForm />
    </main>
  );
}
