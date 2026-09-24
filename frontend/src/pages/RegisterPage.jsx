import { useEffect, useState } from "react";
import ProducerProfileCard from "@/components/ProducerProfileCard";
import ProducerRegisterForm from "@/components/ProducerRegisterForm";

export default function RegisterPage() {
  const [producer, setProducer] = useState(null);

  useEffect(() => {
    document.title = "Registrate como productor · Mercado Km 0";
  }, []);

  return (
    <main className="mx-auto grid max-w-5xl gap-8 px-4 py-8 md:grid-cols-2">
      <section className="space-y-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Registrá tu emprendimiento</h1>
          <p className="mt-1 text-muted-foreground">
            Creá tu cuenta de productor: con eso ya podés cargar tus productos y que te encuentren.
          </p>
        </div>
        <ProducerRegisterForm onCreated={setProducer} />
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Vista previa de tu perfil
        </h2>
        {producer ? (
          <ProducerProfileCard producer={producer} />
        ) : (
          <p className="rounded-xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
            Completá el formulario y vas a ver acá cómo te verán los vecinos.
          </p>
        )}
      </section>
    </main>
  );
}
