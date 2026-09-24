import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import WhatsAppContactButton from "@/components/WhatsAppContactButton";
import { useAuth } from "@/context/AuthContext";
import { getNeed, updateNeedStatus } from "@/lib/api";

const STATUS_LABELS = {
  OPEN: "Abierta",
  RESOLVED: "Resuelta",
  CLOSED: "Cerrada",
};

export default function NeedDetailPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [need, setNeed] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    getNeed(id)
      .then(setNeed)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    if (need) document.title = `${need.title} · Mercado Km 0`;
  }, [need]);

  async function handleStatusChange(status) {
    setUpdating(true);
    try {
      const updated = await updateNeedStatus(id, status);
      setNeed(updated);
    } catch (err) {
      setError(err.message);
    } finally {
      setUpdating(false);
    }
  }

  if (loading) {
    return (
      <main className="mx-auto max-w-2xl px-4 py-12">
        <p className="text-muted-foreground">Cargando…</p>
      </main>
    );
  }

  if (error && !need) {
    return (
      <main className="mx-auto max-w-2xl px-4 py-12">
        <p className="text-destructive">{error}</p>
        <Button variant="outline" className="mt-4" onClick={() => navigate("/necesidades")}>
          Volver al tablero
        </Button>
      </main>
    );
  }

  const isAuthor = user?.id === need.author.id;
  const message = `Hola ${need.author.businessName}, vi en la plataforma que necesitás ${need.quantity} ${need.unit} de ${need.title}. ¿Podría proveerlo?`;

  return (
    <main className="mx-auto max-w-2xl space-y-6 px-4 py-8">
      <Card>
        <CardHeader className="gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-secondary px-2 py-0.5 text-xs font-medium text-secondary-foreground">
              {need.category}
            </span>
            <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
              {STATUS_LABELS[need.status]}
            </span>
          </div>
          <CardTitle className="text-2xl">{need.title}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          <p className="text-base font-medium">
            {need.quantity} {need.unit} · {need.frequency}
          </p>
          {need.description && <p className="text-muted-foreground">{need.description}</p>}
          <p className="text-muted-foreground">
            Publicado por <strong className="text-foreground">{need.author.businessName}</strong> (
            {need.author.name})
          </p>

          {error && <p className="text-destructive">{error}</p>}

          {isAuthor ? (
            need.status === "OPEN" && (
              <div className="flex gap-2 pt-2">
                <Button
                  variant="outline"
                  disabled={updating}
                  onClick={() => handleStatusChange("RESOLVED")}
                >
                  Marcar como resuelta
                </Button>
                <Button
                  variant="outline"
                  disabled={updating}
                  onClick={() => handleStatusChange("CLOSED")}
                >
                  Cerrar
                </Button>
              </div>
            )
          ) : (
            <div className="pt-2">
              <WhatsAppContactButton
                producer={need.author}
                message={message}
                label="Puedo proveerlo, contactar por WhatsApp"
              />
            </div>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
