import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import AccountTypeSelector from "@/components/AccountTypeSelector";
import ConsumerRegisterForm from "@/components/ConsumerRegisterForm";
import ProducerProfileCard from "@/components/ProducerProfileCard";
import ProducerRegisterForm from "@/components/ProducerRegisterForm";
import { Button } from "@/components/ui/button";

export default function RegisterPage() {
  const navigate = useNavigate();
  const [accountType, setAccountType] = useState(null); // "PERSONA" | "INSTITUCION" | "PRODUCER"
  const [created, setCreated] = useState(null);

  useEffect(() => {
    document.title = "Crear cuenta · Formosa Unida";
  }, []);

  if (created) {
    return (
      <main className="mx-auto max-w-lg space-y-6 px-4 py-12 text-center">
        <h1 className="text-2xl font-bold tracking-tight">¡Cuenta creada!</h1>
        {accountType === "PRODUCER" ? (
          <div className="space-y-4 text-left">
            <p className="text-muted-foreground">Así te van a ver los vecinos:</p>
            <ProducerProfileCard producer={created} />
          </div>
        ) : (
          <p className="text-muted-foreground">Ya podés buscar y contactar productores.</p>
        )}
        <Button
          size="lg"
          onClick={() => navigate(accountType === "PRODUCER" ? "/mis-productos" : "/")}
        >
          Continuar
        </Button>
      </main>
    );
  }

  if (!accountType) {
    return (
      <main className="mx-auto max-w-4xl space-y-6 px-4 py-12">
        <div className="text-center">
          <h1 className="text-3xl font-bold tracking-tight">Creá tu cuenta</h1>
          <p className="mt-1 text-muted-foreground">Elegí la opción que te corresponde.</p>
        </div>
        <AccountTypeSelector onSelect={setAccountType} />
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-lg space-y-6 px-4 py-12">
      <Button variant="ghost" size="sm" onClick={() => setAccountType(null)}>
        ← Elegir otra opción
      </Button>
      {accountType === "PRODUCER" ? (
        <ProducerRegisterForm onCreated={setCreated} />
      ) : (
        <ConsumerRegisterForm accountType={accountType} onCreated={setCreated} />
      )}
    </main>
  );
}
